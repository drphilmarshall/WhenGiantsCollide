# When Giants Collide In The Universe

A little JavaScript app simulating the formation of structure in the Universe by gravitational collapse. This is a proposed project for Science Hack Day San Francisco 2014; it's based on (and forked from) this [giant planet collision demo](http://www.stefanom.org/wgc/test_nbody.html) by Stefano Meschiari, the magician who created [Super Planet Crash](http://www.stefanom.org/spc).

## Concept

Have a play with [the original giant planet demo](http://www.stefanom.org/colliding-n-body-spheres-particle-mayhem-2/).
Imagine: if we change the units and colored all the points in blue, then, hey presto! Two colliding dark matter halos.

Possibilities:

* We could illustrate the case of the [Bullet Cluster](http://en.wikipedia.org/wiki/Bullet_Cluster) by smashing two galaxy cluster-sized halos together at thousands of km/s. This will be better once treeSPH.js is available, though, when we can put the gas in too.
* We could start the points on an *almost* uniform grid, and then watch structures form by gravity, just as they do in a cosmological N-body simulation done in a supercomputer
* We could add an expanding background (could be tricky)
* We could enable the modification of gravity
* Could we make a very low resolution but *interactive* version of the Dark Sky simulation?

![small piece of the Dark Sky simulation](http://portal.nersc.gov/project/darksky/skillman/darkpanner/slice2/tile-4-8-7.png)




## Understanding the code

* Here's StefanoM's original demo [README](https://github.com/stefano-meschiari/WhenGiantsCollide/edit/master/README.md)
