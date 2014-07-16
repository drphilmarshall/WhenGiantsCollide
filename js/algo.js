"use strict";

var AU = 1.4959787e13;
var MSUN = 1.98892e33;
var MJUP = 1.8986e30;
var MEARTH = 5.97219e27;
var RJUP = 7.1e9;
var RSUN = 6.96e10;
var REARTH = 6.3e8;

var GGRAV = 6.67384e-8;
var MIN_DISTANCE = 300 * RJUP/AU;

var DAY = 8.64e4;
var TWOPI = 6.2831853072e+00;
var SQRT_TWOPI = 2.5066282746e+00;
var K2  = ((GGRAV * MSUN * DAY * DAY) / (AU*AU*AU));
var YEAR = 31556926.;


var RUNIT = AU;
var MUNIT = MSUN;
var TUNIT = DAY;

// Simulation parameters

var x1 = 0;
var x2 = 100 * RJUP/RUNIT;
var R1 = RJUP/RUNIT;
var R2 = 0.5 * RJUP/RUNIT;


var BHTREE = (function() {
    var nodeCache = [];
    var nodeList = [];
    var theta = 0.5;

    var EMPTY = 0;
    var PARTICLE = 1;
    var NODE = 2;
    
    var bhtree = {};
    var p2node = [];
    var tree;

    function createNode() {
        return({
                body:null,
                bodyIndex:-1,
                parent:null,
                type:EMPTY,
                descendants:new Array(NSUB),
                min:new Float64Array(3),
                width:0,
                com: new Float64Array(3),
                mass:0.,
                particleCount:0
        });
    }
    
    function makeNode() {
        if (nodeCache.length == 0) {
            return createNode();
        } else {
            return nodeCache.pop();
        }
    };

    for (var j = 0; j < CACHE_LENGTH; j++)
        nodeCache.push(createNode());
    
    function deleteNode(node) {
        node.type = EMPTY;
        node.mass = 0.;
        node.particleCount = 0;
        VSET3(node.com, 0, 0, 0);
        nodeCache.push(node);
    };

    function divide(node) {
        var mx = node.min[X];
        var my = node.min[Y];
        var mz = node.min[Z];
        var w = node.width;
        
        ASSERT(isFinite(mx), "A coordinate is not finite.");
        ASSERT(isFinite(w), "A coordinate is not finite.");

        var i = 0;
        
        for (var x = 0; x <= 1; x++)
            for (var y = 0; y <= 1; y++)
                for (var z = 0; z <= 1; z++) {
                    var n = makeNode();
                    VSET3(n.min, mx + 0.5 * x * w, my + 0.5 * y * w, mz + 0.5 * z * w);
                    n.width = 0.5*w;
                    n.parent = node;
                    nodeList.push(n);
                    node.descendants[i] = n;
                    i++;
                }

        ASSERT(node.descendants.length == NSUB, "Wrong number of descendants.");        
    }
    
    function addParticle(particle, pIndex, node) {
        var i;
        LOG("Trying to add particle ", pIndex);
        
        // Node is empty, accept a particle
        if (node.type == EMPTY) {
            node.type = PARTICLE;
            node.body = particle;
            node.bodyIndex = pIndex;
            
            LOG("Node empty, accept particle ", pIndex);
        } else if (node.type == PARTICLE) {
            node.type = NODE;
            
            LOG("Node not empty, subdivide node");
            divide(node);
        };

        node.mass += particle[MASS];
        node.particleCount += 1;
        VADD(node.com, node.com, particle);
        VMUL(node.com, (node.particleCount-1)/node.particleCount);
        
        if (node.type == NODE) {
            for (i = 0; i < node.descendants.length; i++)
                if (CONTAINS(particle, node.descendants[i].min, node.descendants[i].width)) {
                    LOG("Adding ", pIndex, " to descendant ", i);
                    
                    addParticle(particle, pIndex, node.descendants[i]);
                    break;
                }
        }
        
    };
    
    bhtree.theta = function(newTheta) {
        if (newTheta)
            theta = newTheta;
        return theta;
    };
    
    var indices;
    var distances;
    var treeWalker;
    var force;
    
    bhtree.init = function(particles) {
        indices = new Int32Array(particles.length);
        distances = new Float64Array(particles.length);
        force = new Float64Array(NPHYS * particles.length);
        
        bhtree.update(particles);
    };

    bhtree.update = function(particles) {
        
        // Tree container
        var i;
        for (i = 0; i < nodeList.length; i++)
            deleteNode(nodeList[i]);

        var max = -1e20;
        var min = -max;
        
        for (i = 0; i < particles.length; i++) {
            max = Math.max(max, particles[i][X], particles[i][Y], particles[i][Z]);
            min = Math.min(min, particles[i][X], particles[i][Y], particles[i][Z]);            
        }
        LOG([min, max]);

        tree = makeNode();
        nodeList = [tree];

        VSET3(tree.min, min, min, min);
        tree.width = max-min;
        
        tree.parent = null;

        for (i = 0; i < particles.length; i++) {
            addParticle(particles[i], i, tree);
        }
        LOG(nodeList.length);

        treeWalker = new Array(nodeList.length);
    };

    
    bhtree.neighborsWithin = function(particle, d) {
        var treeWalker_length = 1;
        treeWalker[0] = tree;
        
        var d2 = d*d;
        var i;
        var idx = 0;
        
        while (treeWalker_length > 0) {
            treeWalker_length--;
            var n = treeWalker[treeWalker_length];
           
            if (n.type == EMPTY) {
                continue;
            } else {
                var dist2 = D2(particle, n.body);
                if (dist2 < d2) {
                    distances[idx] = Math.sqrt(dist2);
                    indices[idx] = n.bodyIndex;
                    idx++;
                }
                if (n.type == NODE) {
                    for (i = 0; i < NSUB; i++) {
                        var min = n.descendants[i].min;
                        var w = n.descendants[i].width;
                        if (NODEINTERSECTS(min, w, particle, d)) {
                            treeWalker[treeWalker_length] = n.descendants[i];
                            treeWalker_length++;
                        }
                    }
                }
            }
        }

        return [idx, indices, distances];
    };

    bhtree.forceAndNeighbors = function(particles) {
        for (var i = 0; i < particles.length; i++) {
            var f = force.subarray(i * NPHYS, (i+1)*NPHYS);

            var treeWalker_length = 1;
            treeWalker[0] = tree;

            while (treeWalker_length > 0) {
                treeWalker_length--;
                var n = treeWalker[treeWalker_length];
                var width2 = SQR(n.width);
                var d2 = 
                
            }
            
        }
    };

    bhtree.bruteForce = function(particles) {
        
    };
    
    bhtree.tree = function() {
        return tree;
    };

    bhtree.size = function() {
        return nodeList.length;
    };
    
    bhtree.log = function() {
        console.log(tree);
    };
    
    return bhtree;
})();

var SYSTEM = (function() {
    var system = {};
    
    var com = new Float64Array(NCOORDS);
    var p = [];
    var f = [];
    var f1 = [];
    

    var grid;
    var gridn = 100;
    var force;

    system.init = function(N, M1, M2, x1, x2, R1, R2) {
        var i;
        
        for (i = 0; i < N; i++)
            p.push(new Float64Array(NCOORDS));

        force = new Float64Array(NCOORDS);
        
        // Use M1/(M1+M2) particles for the first planet
        var N1 = (M1/(M1+M2) * N)|0;
        for (i = 0; i < N1; i++) {
            p[i][BODY] = 0;
            p[i][X] = Math.random() * R1 + x1;
            p[i][Y] = Math.random() * R1;
            p[i][Z] = Math.random() * R1;
            p[i][MASS] = M1/N1;
        }

        
        for (i = N1; i < N; i++)
            p[i][BODY] = 1;

        LOG(N1);
        LOG(N);
    };

    system.particles = function() {
        return p;
    };

    system.n2d = function() {
        var d = 0.1 * R1;
        var d2 = d*d;
        var i, j;
        var neighs = 0;
        for (i = 0; i < p.length; i++)
            for (j = 0; j < p.length; j++)
        {};
    };
    
    return system;
    
})();

_.benchmark = function(Nb, fun) {
    var d = +(new Date());
    for (var i = 0; i < Nb-1; i++)
        fun();
    console.log(fun());
    return (+(new Date())-d)/Nb;
};


if (typeof(exports) !== 'undefined') {
    exports.SYSTEM = SYSTEM;
    exports.BHTREE = BHTREE;
    exports.R1 = R1;
    exports.R2 = R2;
    exports.x1 = x1;
    exports.x2 = x2;
}