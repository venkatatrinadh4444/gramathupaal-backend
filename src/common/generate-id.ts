import { BadRequestException } from "@nestjs/common";


export function GenerateId(type:string,value:number) {
    let idValue:string;
    switch(type) {
        case "COW":
            const cowId="COW"+"-"+value.toString().padStart(3,'0')
            idValue=cowId
            break;
        case "BUFFALO":
            const buffaloId="BUFFALO"+value.toString().padStart(3,'0')
            idValue=buffaloId
            break;
        case "GOAT":
            const goatId="GOAT"+value.toString().padStart(3,'0')
            idValue=goatId
            break;
        default:
            throw new BadRequestException('Please enter valid type')
    }
    return idValue;
}