# When Giants Collide In The Universe

A little JavaScript app simulating the formation of structure in the Universe by gravitational collapse. This is a proposed project for Science Hack Day San Francisco 2014; it's based on (and forked from) this [giant planet collision demo](http://www.stefanom.org/wgc) by Stefano Meschiari, the genius who created [Super Planet Crash](http://www.stefanom.org/spc).

## Concept

Look at this [screengrab]() of the original giant planet demo:
![screenshot]()

If we change the units and color all the points in blue, hey presto! Two colliding dark matter halos.

Possibilities:

* Illustrate the case of the Bullet Cluster by smashing two cluster-sized halos together. This will be better once treeSPH.js is available, though.
* Start the points on an *almost* uniform grid, and then watch structures form by gravity, just as they do in a cosmological N-body simulation done in a supercomputer
* Add an expanding background (could be tricky)
* Modify gravity
* ...

![small piece of the Las Damas simulation](http://www.vanderbilt.edu/AnS/physics/vida/lasdamas.gif)

Can we make a very low resolution but interactive version of this?


## Understanding the code

* Here's StefanoM's original demo [README](https://github.com/stefano-meschiari/WhenGiantsCollide/edit/master/README.md)
