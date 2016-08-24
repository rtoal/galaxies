/*
 * galaxies.js
 *
 * Adapted from galaxy.c, the Galaxy Collision Screen Saver, originally written by Uli Siegmund
 * <uli@wombat.okapi.sub.org> on Amiga for EGS in Cluster.
 *
 * Port from Cluster/EGS to C/Intuition by Harald Backert.
 *
 * Port to X11 & incorporation into xlockmore by Hubert Feyrer <hubert.feyrer@rz.uni-regensburg.de>.
 *
 * Permission to use, copy, modify, and distribute this software and its documentation for any
 * purpose and without fee is hereby granted, provided that the above copyright notice appear in
 * all copies and that both that copyright notice and this permission notice appear in supporting
 * documentation.
 *
 * This file is provided AS IS with no warranties of any kind.  The author shall have no liability
 * with respect to the infringement of copyrights, trade secrets or any patents by this file or any
 * part thereof.  In no event will the author be liable for any lost revenue or profits or other
 * special, indirect and consequential damages.
 *
 * Revision History:
 *
 * 2016-08-14: Ported to ES2015 JavaScript by Ray Toal <rtoal@lmu.edu>
 * 2011-03-12: Ported to JavaScript by Ray Toal <rtoal@lmu.edu>
 * 2001-11-08: Converted to Java applet by Chris Stevenson <chris.stevenson@adelaide.on.net>
 *             http://www.users.on.net/zhcchz/java/galaxy/UniverseApplet.html with z axis
 *             information for star size, perspective view by Richard Loftin <rich@sevenravens.com>
 * 2000-11-14: Port to Win32 by Richard Loftin <rich@sevenravens.com>, now uses z axis information
 *             for star size, perspective view.
 * 1997-05-10: Compatible with xscreensaver
 * 1997-04-18: Memory leak fixed by Tom Schmidt <tschmidt@micron.com>
 * 1997-04-07: Modified by Dave Mitchell <davem@magnet.com>: random star sizes, colors change
 *             depending on velocity
 * 1994-10-23: Modified by David Bagley <bagleyd@tux.org>
 * 1994-10-10: Add colors by Hubert Feyer
 * 1994-09-30: Initial port by Hubert Feyer
 * 1994-03-09: VMS can generate a random number 0.0 which results in a division by zero,
 *             corrected by Jouk Jansen <joukj@hrem.stm.tudelft.nl>
 */

(function () {

  /*
   * A star belongs to a galaxy and has a size, pos, and vel.
   */
  class Star {

    constructor(galaxy) {

      const w = 2 * Math.PI * Math.random();
      const d = Math.random() * galaxy.size;
      const dsinw = d * Math.sin(w);
      const dcosw = d * Math.cos(w);
      let h = Math.random() * Math.exp(-2 * (d / galaxy.size)) / 5 * galaxy.size;
      if (Math.random() < 0.5) {
        h = -h;
      }
      const v = Math.sqrt(galaxy.mass * 0.001 / Math.sqrt(d * d + h * h));
      const vsinw = v * Math.sin(w);
      const vcosw = v * Math.cos(w);

      this.size = Math.floor(Math.random() * 7);

      this.pos = [
        galaxy.mat[0][0] * dcosw + galaxy.mat[1][0] * dsinw
          + galaxy.mat[2][0] * h + galaxy.pos[0],
        galaxy.mat[0][1] * dcosw + galaxy.mat[1][1] * dsinw
          + galaxy.mat[2][1] * h + galaxy.pos[1],
        galaxy.mat[0][2] * dcosw + galaxy.mat[1][2] * dsinw
          + galaxy.mat[2][2] * h + galaxy.pos[2]
      ];

      this.vel = [
        -galaxy.mat[0][0] * vsinw + galaxy.mat[1][0] * vcosw + galaxy.vel[0],
        -galaxy.mat[0][1] * vsinw + galaxy.mat[1][1] * vcosw + galaxy.vel[1],
        -galaxy.mat[0][2] * vsinw + galaxy.mat[1][2] * vcosw + galaxy.vel[2]
      ];
    }
  }

  /*
   * A galxay exists within a universe and has a mass, size, vel, pos, mat, and stars.
   */
  class Galaxy {

    static get MAX_STARS() {return 700;}
    static get RANGE_SIZE() {return 0.1;}
    static get MIN_SIZE() {return 0.1;}

    constructor(universe) {

      const Z_OFFSET = 1.5;
      this.mass = Galaxy.MAX_STARS;
      this.size = Galaxy.RANGE_SIZE * Math.random() + Galaxy.MIN_SIZE;

      this.vel = [
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1
      ];

      this.pos = [
        -this.vel[0] * universe.deltat * universe.hitIterations + Math.random() - 0.5,
        -this.vel[1] * universe.deltat * universe.hitIterations + Math.random() - 0.5,
        (-this.vel[2] * universe.deltat * universe.hitIterations + Math.random() - 0.5) + Z_OFFSET
      ];

      const w1 = 2 * Math.PI * Math.random();
      const w2 = 2 * Math.PI * Math.random();
      const sinw1 = Math.sin(w1);
      const sinw2 = Math.sin(w2);
      const cosw1 = Math.cos(w1);
      const cosw2 = Math.cos(w2);

      this.mat = [
        [cosw2, -sinw1 * sinw2, cosw1 * sinw2],
        [0, cosw1, sinw1],
        [-sinw2, -sinw1 * cosw2, cosw1 * cosw2]
      ];

      this.stars = [];
      for (let i = 0; i < Galaxy.MAX_STARS; i++) {
        this.stars.push(new Star(this));
      }
    }
  }

  /*
   * A universe contains the galaxies, and some global-ish stuff.
   */
  class Universe {

    static get MAX_LIFETIME() {return 800;}

    constructor(galaxyCount) {
      this.hitIterations = 100;
      this.deltat = 0.005;
      this.galaxies = [];
      for (let i = 0; i < galaxyCount; i++) {
        this.galaxies.push(new Galaxy(this));
      }
    }
  }

  // Global state, changed during simulation
  let galaxyCount = 3;
  let step = 0;
  let universe = new Universe(galaxyCount);

  // UI
  const canvas = document.getElementById("galaxies");
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;
  const halfCanvasWidth = canvasWidth / 2;
  const halfCanvasHeight = canvasHeight / 2;
  const colors = [
    '#ffffcc', '#ccffff','#ffccff','#ccffcc','#ccccff','#ffcccc',
    '#80ffbf','#bf80ff','#ffbf80','#bfff80','#80bfff','#ff80bf',
  ];
  const ctx = canvas.getContext("2d");

  function startSimulation() {
    // Populate a dropdown so user can select a different galaxy count (3...12)
    const menuElement = document.getElementById("menu");
    for (let i = 3; i <= 12; i += 1) {
      let button = document.createElement("button");
      button.innerHTML = i;
      button.onclick = () => {
        galaxyCount = i;
        step = Universe.MAX_LIFETIME;
      }
      menuElement.appendChild(button);
    }
    requestAnimationFrame(drawAndUpdate);
  }

  function drawUniverse() {
    var delta = 0.000005;
    var deltat = universe.deltat;

    // Draw each galaxy
    for (let i = 0; i < universe.galaxies.length; ++i) {
      const gt = universe.galaxies[i];
      ctx.fillStyle = colors[i];

      // Draw each star in the galaxy
      for (let star of gt.stars) {
        let v0 = star.vel[0];
        let v1 = star.vel[1];
        let v2 = star.vel[2];

        for (let k = 0; k < universe.galaxies.length; ++k) {
          const gtk = universe.galaxies[k];
          const d0 = gtk.pos[0] - star.pos[0];
          const d1 = gtk.pos[1] - star.pos[1];
          const d2 = gtk.pos[2] - star.pos[2];

          let d = d0 * d0 + d1 * d1 + d2 * d2;
          d = gt.mass / (d * Math.sqrt(d)) * delta;

          v0 += d0 * d;
          v1 += d1 * d;
          v2 += d2 * d;
        }

        star.vel[0] = v0;
        star.vel[1] = v1;
        star.vel[2] = v2;

        star.pos[0] += v0 * deltat;
        star.pos[1] += v1 * deltat;
        star.pos[2] += v2 * deltat;

        if (star.pos[2] > 0.0) {
          const x = Math.floor((150 * star.pos[0] / star.pos[2]) + halfCanvasWidth);
          const y = Math.floor((150 * star.pos[1] / star.pos[2]) + halfCanvasHeight);
          const z = Math.min(Math.floor(2 / (star.pos[2] + star.size)) + 1, 10);
          ctx.fillRect(x, y, z, z);
        }
      }

      // Affect the rest of the galaxies
      for (let k = i + 1; k < universe.galaxies.length; ++k) {
        const gtk = universe.galaxies[k];
        let d0 = gtk.pos[0] - gt.pos[0];
        let d1 = gtk.pos[1] - gt.pos[1];
        let d2 = gtk.pos[2] - gt.pos[2];

        let d = d0 * d0 + d1 * d1 + d2 * d2;
        d = gt.mass * gt.mass / (d * Math.sqrt(d)) * delta;

        d0 *= d;
        d1 *= d;
        d2 *= d;
        gt.vel[0] += d0 / gt.mass;
        gt.vel[1] += d1 / gt.mass;
        gt.vel[2] += d2 / gt.mass;
        gtk.vel[0] -= d0 / gtk.mass;
        gtk.vel[1] -= d1 / gtk.mass;
        gtk.vel[2] -= d2 / gtk.mass;
      }

      gt.pos[0] += gt.vel[0] * deltat;
      gt.pos[1] += gt.vel[1] * deltat;
      gt.pos[2] += gt.vel[2] * deltat;
    }
  }

  function drawAndUpdate() {
    ctx.fillStyle = "rgb(0,0,0)";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    drawUniverse();

    step += 1;
    if (step > Universe.MAX_LIFETIME) {
      step = 0;
      universe = new Universe(galaxyCount);
    }

    requestAnimationFrame(drawAndUpdate);
  }

  startSimulation();
}());
