import Color from "../libs/Color.js";
import Counter from "../libs/Counter.js";
import V3 from "../libs/V3.js";
import Bullet from "./SimpleBullet.js";

export default class HomingBullet extends Bullet{
    velocity = 2;
    radius = 6;
    color = new Color(0,0.9,0.9);

    target;
    lifeTimer = new Counter(150);
    move() {
        let targetDirection = this.target.position.sub(this.position).normalized();
        
        if(this.direction.dot(targetDirection)>0.9) this.direction = targetDirection;
        else this.direction = this.direction.lerp(targetDirection,0.1).normalized();

        this.position = this.position.add(this.direction.scale(this.velocity));
    }
    setTarget(target) {
        this.target = target;
    }
}