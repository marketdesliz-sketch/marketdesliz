/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3756124705");

  return app.delete(collection);
}, (app) => {
  const collection = new Collection({
    "createRule": "@request.auth.id != \"\"",
    "deleteRule": "@request.auth.role = \"admin\"",
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text3208210256",
        "max": 15,
        "min": 15,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "number777123888",
        "max": null,
        "min": null,
        "name": "productosComprados",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number2386483518",
        "max": null,
        "min": null,
        "name": "productosPagados",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number1265192798",
        "max": null,
        "min": null,
        "name": "productosEnCurso",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number2271227848",
        "max": null,
        "min": null,
        "name": "nivelActual",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number2337386099",
        "max": null,
        "min": null,
        "name": "tandaDisponible",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number3942894169",
        "max": null,
        "min": null,
        "name": "deudaActual",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number4139286901",
        "max": null,
        "min": null,
        "name": "limiteDeuda",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "date3220005127",
        "max": "",
        "min": "",
        "name": "fechaPrimerProducto",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "date"
      },
      {
        "hidden": false,
        "id": "date429514562",
        "max": "",
        "min": "",
        "name": "fechaUltimoProducto",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "date"
      },
      {
        "cascadeDelete": false,
        "collectionId": "_pb_users_auth_",
        "hidden": false,
        "id": "relation2777886149",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "clienteId",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "number3577761809",
        "max": null,
        "min": null,
        "name": "productosFaltantes",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "autodate2990389176",
        "name": "created",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": false,
        "type": "autodate"
      },
      {
        "hidden": false,
        "id": "autodate3332085495",
        "name": "updated",
        "onCreate": true,
        "onUpdate": true,
        "presentable": false,
        "system": false,
        "type": "autodate"
      }
    ],
    "id": "pbc_3756124705",
    "indexes": [],
    "listRule": "@request.auth.role = \"admin\" || clienteId = @request.auth.id",
    "name": "niveles_cliente",
    "system": false,
    "type": "base",
    "updateRule": "@request.auth.role = \"admin\" || clienteId = @request.auth.id",
    "viewRule": "@request.auth.role = \"admin\" || clienteId = @request.auth.id"
  });

  return app.save(collection);
})
