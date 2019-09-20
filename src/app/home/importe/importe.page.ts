import { Component } from "@angular/core"
import { PopoverController, NavParams } from '@ionic/angular';
import { Conceptos } from "../home.page"
@Component({
    templateUrl: './importe.page.html',
    styleUrls: ["./importe.page.css"]
})

export class ImporteComponent {
    data: any
    created: boolean = false
    constructor(public popoverController: PopoverController, public navParams: NavParams) {
        if (navParams.data.precio) {
            this.data = navParams.data
            this.created = true
        } else {
            this.data = {
                precio: "",
                cantidad: "",
                concepto: "",
                total: ""
            }
            this.created = false
        }
    }

    add() {
        if (this.data.concepto && this.data.cantidad && this.data.precio) {
            this.data.total = Number(this.data.precio) * Number(this.data.cantidad)
            this.popoverController.dismiss(this.data, this.created ? "update" : "create")
        }
    }

    dismiss() {
        this.popoverController.dismiss();
    }

}