import { Component, OnDestroy, OnInit } from '@angular/core';
import { ImporteComponent } from './importe/importe.page';

import { PopoverController, LoadingController, Platform, ToastController } from '@ionic/angular';
import { AppService } from './http.service';
import { Subject, Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy {
  facturacion: Facturacion = {
    iva: 16,
    rfc: "",
    email: "",
    total: 0,
    subtotal: 0,
    totaliva: 0,
    conceptos: []
  }
  internetConection: boolean
  subjectInternet: Subscription;

  constructor(public toastController: ToastController, public popoverController: PopoverController, public loadingController: LoadingController, public platform: Platform, private http: AppService) {

  }

  ngOnInit() {
    this.subjectInternet = this.http.getInternetStatus().subscribe(status => {
      this.internetConection = status.status
    })
  }

  async presentPopover(ev: Conceptos, i: any) {
    const popover = await this.popoverController.create({
      component: ImporteComponent,
      componentProps: ev,
      translucent: true
    })
    popover.onDidDismiss().then((res: any) => {
      if (res.data != undefined) {
        if (res.role == "create") {
          this.facturacion.conceptos.push(res.data)
        } else if (res.role == "update") {
          this.facturacion.conceptos[i] = res.data
        }
        this.total()
      }
    })
    return await popover.present();
  }

  total() {
    this.facturacion.subtotal = this.subtotal()
    this.facturacion.totaliva = (Number(this.subtotal()) / 100) * Number(this.facturacion.iva)
    this.facturacion.total = Number(this.facturacion.subtotal) + Number(this.facturacion.totaliva)
  }

  async presentLoading() {
    const loading = await this.loadingController.create({
      message: 'Guardando Factura',
      duration: 2000
    });
    await loading.present();
  }

  subtotal(): Number {
    let a = 0
    this.facturacion.conceptos.map((x: Conceptos) => {
      a = a + Number(x.total)
    })
    return a
  }


  postFacturacion(): any {
    if (this.facturacion.conceptos.length > 0 && this.facturacion.rfc && this.facturacion.email) {
      if (this.platform.is('cordova')) {
        this.http.createFactura(this.facturacion).then(res => {
          this.http.createDB()
          this.facturacion = {
            iva: this.facturacion.iva,
            rfc: "",
            email: "",
            total: 0,
            subtotal: 0,
            totaliva: 0,
            conceptos: []
          }
        })
      }
    }
  }

  async clear() {
    const toast = await this.toastController.create({
      header: 'Estas Seguro?',
      message: 'Se eliminara toda la informacion actual.',
      position: 'top',
      color: 'danger',
      buttons: [
        {
          icon: 'checkmark',
          text: 'Aceptar',
          handler: () => {
            this.facturacion = {
              iva: this.facturacion.iva,
              rfc: "",
              email: "",
              total: 0,
              subtotal: 0,
              totaliva: 0,
              conceptos: []
            }
          }
        }, {
          icon: 'close',
          text: 'Cancel',
        }
      ]
    });
    toast.present();
  }

  async trash(id: any) {
    const toast = await this.toastController.create({
      header: 'Estas Seguro?',
      message: 'Se removera de la lista el concepto actual.',
      position: 'top',
      color: 'danger',
      buttons: [
        {
          icon: 'checkmark',
          text: 'Aceptar',
          handler: () => {
            new Promise((resolve) => {
              resolve(this.facturacion.conceptos = this.facturacion.conceptos.filter((x, i) => i != id))
            }).then(() => {
              this.total()
            })
          }
        }, {
          icon: 'close',
          text: 'Cancel',
        }
      ]
    });
    toast.present();
  }

  ngOnDestroy() {
    this.subjectInternet.unsubscribe()
  }

}

export interface Conceptos {
  precio: Number,
  total: Number,
  concepto: String,
  cantidad: Number
}

export interface Facturacion {
  iva: Number,
  rfc: String,
  email: String,
  total: Number,
  subtotal: Number,
  totaliva: Number,
  conceptos: Conceptos[]
}
