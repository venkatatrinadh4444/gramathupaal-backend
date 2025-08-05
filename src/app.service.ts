import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
    getUser() {
        return `<div>
        <b style="color:green;">Backend for Gramathupaal project</b>
        </div>`
    }
}