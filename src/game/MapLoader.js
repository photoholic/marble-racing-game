import Matter from 'matter-js';

const { Composite, Events } = Matter;

export class MapLoader {
    constructor(engineSetup) {
        this.engineSetup = engineSetup;
        this.engine = engineSetup.engine;
        this.world = engineSetup.world;
        this.onMarbleFinish = null;

        Events.on(this.engine, 'collisionStart', (event) => {
            const pairs = event.pairs;
            for (let i = 0; i < pairs.length; i++) {
                const bodyA = pairs[i].bodyA;
                const bodyB = pairs[i].bodyB;

                if (bodyA.label === 'FinishLine' && bodyB.label === 'Marble') {
                    if (this.onMarbleFinish) this.onMarbleFinish(bodyB);
                } else if (bodyB.label === 'FinishLine' && bodyA.label === 'Marble') {
                    if (this.onMarbleFinish) this.onMarbleFinish(bodyA);
                }
            }
        });
    }

    loadMap(mapData) {
        const width = window.innerWidth;
        const bodies = mapData.generate(width);
        Composite.add(this.world, bodies);
    }
}
