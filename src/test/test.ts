import {InSetStrategy} from "../core/strategies/ValidationStrategy"

const inSet = new InSetStrategy();

console.log("RESULT CHECK: ", inSet.validate(1, [1, 2]))