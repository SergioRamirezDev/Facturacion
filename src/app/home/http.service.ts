import { Injectable } from '@angular/core'
import { Observable, BehaviorSubject, Observer } from 'rxjs';
import { ToastController, LoadingController, Platform } from '@ionic/angular';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite/ngx';
import { Subject } from 'rxjs';
import 'rxjs/Rx';
import { Network } from '@ionic-native/network/ngx';
import { Facturacion, Conceptos } from './home.page';
import { RequestOptions, Headers } from '@angular/http'
import { HttpClient, HttpEvent, HttpInterceptor, HttpHandler, HttpRequest } from '@angular/common/http';

const environment = {
    BASE_URL: "http://138.197.206.105:81",
    API_URL: "api/v1"
}

@Injectable()
export class AppService {
    private isOpen: boolean = false;
    public requests: number = 0;
    private db: SQLiteObject;
    public loading: any;
    private subject = new Subject<any>();
    public internetsubject = new Subject<any>();

    request: number = 0
    requestSub = new BehaviorSubject<number>(this.request);


    constructor(private net: Network, public platform: Platform, private sqlite: SQLite, private http: HttpClient, public toastCtrl: ToastController, public loadingCtrl: LoadingController) {
        this.net.onDisconnect().subscribe(() => {
            this.setInternetStatus(false)
        });
        this.net.onConnect().subscribe(() => {
            this.setInternetStatus(true)
        })
        this.platform.ready().then(() => {
            if (this.platform.is('cordova')) {
                if (!this.isOpen) {
                    this.sqlite = new SQLite();
                    this.sqlite.create({
                        name: 'facturacion.db',
                        location: 'default'
                    })
                        .then((db: SQLiteObject) => {
                            this.db = db;
                            this.isOpen = true;
                            this.setDataBaseStatus(this.isOpen)
                            this.createDB()
                        })
                        .catch(e => { console.log(e) });
                }
            }
        });
    }

    createDB() {
        this.db.executeSql("CREATE TABLE IF NOT EXISTS facturaciones (id INTEGER PRIMARY KEY AUTOINCREMENT, rfc VARCHAR(13) NOT NULL,email VARCHAR(40) NOT NULL,iva INTEGER(3) NOT NULL, subtotal FLOAT NOT NULL,totaliva FLOAT NOT NULL, total FLOAT NOT NULL)", [])
            .then(res => {
                this.db.executeSql("CREATE TABLE IF NOT EXISTS conceptos (id INTEGER PRIMARY KEY AUTOINCREMENT,facturacion_id INTEGER(11) NOT NULL, concepto VARCHAR(255) NOT NULL,precio FLOAT NOT NULL,total FLOAT NOT NULL,cantidad INTEGER(11) NOT NULL,FOREIGN KEY(facturacion_id) REFERENCES facturaciones(id))", [])
                    .then(res => {
                        this.postAllFacturas().then((result: any) => {
                            if (result.success) {
                                this.db.executeSql("DELETE FROM facturaciones", [])
                                    .then(res => {
                                        this.db.executeSql("DELETE FROM conceptos", [])
                                            .then(res => {

                                            }).catch(err => {
                                                console.log(err.message)
                                            })
                                    }).catch(err => {
                                        console.log(err.message)
                                    })
                            }
                        }).catch(err => {
                            console.log(err.message)
                        })
                    }).catch(err => {
                        console.log(err.message)
                    })
            }).catch(err => {
                console.log(err.message)
            })
    }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const authReq = req.clone({
            setHeaders: {
                "Content-Type": 'application/json'
            }
        });

        return next.handle(authReq);
    }

    public get(endpoint: string): Observable<any> {
        this.request = this.request + 1;
        this.requestSub.next(this.request)
        console.time(endpoint)
        return this.http.get(`${environment.BASE_URL}/${environment.API_URL}/${endpoint}`)
            .map((res: any) => this.result('get', endpoint, res, ""))
            .catch(error => this.handleError(error, endpoint, ""));
    }

    public post(endpoint: string, params: any, formdata: boolean = false): Observable<any> {
        this.request = this.request + 1;
        this.requestSub.next(this.request)
        console.log("Datos a enviara", params)
        console.time(endpoint)
        return this.http.post(`${environment.BASE_URL}/${environment.API_URL}/${endpoint}`, params)
            .map((res: any) => this.result('post', endpoint, res, params))
            .catch(error => this.handleError(error, endpoint, params));
    }

    public delete(endpoint: string): Observable<any> {
        this.request = this.request + 1;
        this.requestSub.next(this.request)
        console.time(endpoint)
        return this.http.delete(`${environment.BASE_URL}/${environment.API_URL}/${endpoint}`)
            .map((res: any) => this.result('delete', endpoint, res, ""))
            .catch(error => this.handleError(error, endpoint, ""));
    }

    public put(endpoint: string, params: any, formdata: boolean = false): Observable<any> {
        this.request = this.request + 1;
        this.requestSub.next(this.request)
        console.time(endpoint)
        return this.http.put(`${environment.BASE_URL}/${environment.API_URL}/${endpoint}`, params)
            .map((res: any) => this.result('post', endpoint, res, params))
            .catch(error => this.handleError(error, endpoint, params));
    }

    private handleError(error, endpoint: string, params: any) {
        this.request = this.request - 1;
        this.requestSub.next(this.request)
        if (error.status === 400 || error.status === 401) {
            //this.presentToast(error.statusText);
        } else {
            //this.presentToast(`Backend error, please check "${endpoint}"`)
        }
        console.timeEnd(endpoint)
        console.log(endpoint, error, params)
        return Observable.throw(error);
    }

    public result(name: string, endpoint: string, data: any, params: any) {
        this.request = this.request - 1;
        this.requestSub.next(this.request)
        if (data.msg) {
            this.presentToast(data.msg)
        }
        console.timeEnd(endpoint)
        console.log(endpoint, data, params)
        return data
    }

    public formData(params: any): FormData {
        let formdata = new FormData();
        Object.keys(params).map(x => {
            formdata.append(x, params[x])
        });
        return formdata;
    }

    public RequestLoading = () => {
        return Observable.create((observer: Observer<number>) => {
            this.requestSub.subscribe(data => {
                observer.next(data);
            })
        })
    }

    async presentToast(msg: string) {
        const toast = await this.toastCtrl.create({
            message: msg,
            duration: 3000
        });
        toast.present();
    }

    setDataBaseStatus(open: boolean) {
        this.subject.next({ open: open });
    }

    getDataBaseStatus(): Observable<any> {
        return this.subject.asObservable();
    }

    setInternetStatus(status: boolean) {
        this.internetsubject.next({ status: status });
    }

    getInternetStatus(): Observable<any> {
        return this.internetsubject.asObservable();
    }

    getFacturaciones(sql: string = ""): Promise<any> {
        return new Promise((resolve, reject) => {
            if (this.isOpen) {
                this.db.executeSql("SELECT * FROM facturaciones" + sql, []).then((data) => {
                    let array = [];
                    for (var i = 0; i < data.rows.length; i++) {
                        let concepto = [];
                        this.db.executeSql("SELECT * FROM conceptos where facturacion_id = " + data.rows.item(i).id, []).then((conceptos) => {
                            for (var x = 0; x < conceptos.rows.length; x++) {
                                concepto.push({
                                    precio: conceptos.rows.item(x).precio,
                                    concepto: conceptos.rows.item(x).concepto,
                                    cantidad: conceptos.rows.item(x).cantidad,
                                    total: conceptos.rows.item(x).total
                                });
                            }
                        });
                        array.push({
                            rfc: data.rows.item(i).rfc,
                            email: data.rows.item(i).email,
                            iva: data.rows.item(i).iva,
                            subtotal: data.rows.item(i).subtotal,
                            totaliva: data.rows.item(i).totaliva,
                            total: data.rows.item(i).total,
                            conceptos: concepto
                        });
                    }
                    resolve(array);
                }, (error) => {
                    reject(error);
                })
            }
        }).catch(error => {
            this.presentToast(error.message)
            console.log(error)
        })
    }

    postAllFacturas(): Promise<any> {
        return new Promise((resolve, reject) => {
            this.getFacturaciones().then((data: any) => {
                this.post('facturacion/sync', { data: data }).subscribe(
                    data => {
                        this.result("post", 'facturacion/sync', data, "")
                        resolve(data)
                    },
                    error => {
                        this.handleError(error, 'facturacion/sync', data)
                        reject(error)
                    }
                )
            });
        })
    }

    createFactura(factura: Facturacion): Promise<any> {
        return new Promise((resolve, reject) => {
            this.db.executeSql("INSERT INTO facturaciones (rfc,email,iva, subtotal,totaliva,total) VALUES (?, ?, ?, ?, ?, ?)", [factura.rfc, factura.email, factura.iva, factura.subtotal, factura.totaliva, factura.total])
                .then((data) => {
                    for (var i = 0; i < factura.conceptos.length; i++) {
                        this.db.executeSql("INSERT INTO conceptos (concepto,precio,cantidad,total,facturacion_id) VALUES (?, ?, ?, ?,?)", [factura.conceptos[i].concepto, factura.conceptos[i].precio, factura.conceptos[i].cantidad, factura.conceptos[i].total, data.insertId])
                            .then((data) => {

                            }).catch(err => {
                                this.presentToast(err)
                                console.log(err.message)
                                reject(err)
                            })
                    }
                    resolve(data)
                    this.presentToast("Factura creada para sincronizacion")
                }).catch(err => {
                    this.presentToast(err)
                    console.log(err.message)
                    reject(err)
                })
        })
    }

}