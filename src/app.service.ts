import { BadRequestException, Injectable } from "@nestjs/common";
import { catchBlock } from "./common/catch-block";

@Injectable()
export class AppService {
    getUser() {
        return `<div>
        <b style="color:green;">Backend for Gramathupaal project</b>
        </div>`
    }

}