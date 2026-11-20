import { type Object3D, Quaternion, Vector3 } from 'three'

// These bones extend along local -X. Raise the hand to the shoulder with the
// elbow forward, and keep the log aligned with the model's forward (+Z) axis.
const armAxis = new Vector3(-1, 0, 0)
const carryArm = new Quaternion().setFromUnitVectors(
    armAxis,
    new Vector3(-0.22, -0.6, 0.77).normalize(),
)
const carryForearm = new Quaternion().setFromUnitVectors(
    armAxis,
    new Vector3(0.14, 0.9, -0.41).normalize(),
)
const carryHand = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), -Math.PI / 2)
const carryPose = [
    ['RightArm', carryArm],
    ['RightForeArm', carryArm.clone().invert().multiply(carryForearm)],
    ['RightHand', carryForearm.clone().invert().multiply(carryHand)],
] as const

export function bindCarryPose(model: Object3D) {
    return carryPose.flatMap(([name, rotation]) => {
        const bone = model.getObjectByName(`mixamorig${name}`)
        return bone ? [{ bone, rotation, animatedRotation: new Quaternion() }] : []
    })
}
