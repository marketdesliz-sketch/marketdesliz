/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_637990001");

  return app.delete(collection);
}, (app) => {
  const collection = new Collection({
    "createRule": "@request.auth.role = \"admin\"",
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
        "cascadeDelete": false,
        "collectionId": "pbc_631030571",
        "hidden": false,
        "id": "relation1975916462",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "paymentId",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": false,
        "collectionId": "pbc_3527180448",
        "hidden": false,
        "id": "relation4196627511",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "orderId",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "date3275789471",
        "max": "",
        "min": "",
        "name": "fecha",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "date"
      },
      {
        "hidden": false,
        "id": "select2063623452",
        "maxSelect": 1,
        "name": "estado",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "pendiente",
          "completado",
          "no_encontrado",
          "reprogramado"
        ]
      },
      {
        "cascadeDelete": false,
        "collectionId": "pbc_4092854851",
        "hidden": false,
        "id": "relation3544843437",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "productId",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "select2363381545",
        "maxSelect": 1,
        "name": "tipo",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "visita",
          "entrega",
          "cobro"
        ]
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text3152135767",
        "max": 0,
        "min": 0,
        "name": "hora",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text1029162715",
        "max": 0,
        "min": 0,
        "name": "detalles",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text4085563029",
        "max": 0,
        "min": 0,
        "name": "direccion",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "cascadeDelete": false,
        "collectionId": "_pb_users_auth_",
        "hidden": false,
        "id": "relation3343123541",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "userId",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "select2223302008",
        "maxSelect": 1,
        "name": "metodoPago",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "select",
        "values": [
          "qr",
          "transferencia"
        ]
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text18589324",
        "max": 0,
        "min": 0,
        "name": "notas",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "file3870244367",
        "maxSelect": 1,
        "maxSize": 0,
        "mimeTypes": [],
        "name": "fechaAsignacion",
        "presentable": false,
        "protected": false,
        "required": false,
        "system": false,
        "thumbs": [],
        "type": "file"
      },
      {
        "hidden": false,
        "id": "file1718663312",
        "maxSelect": 1,
        "maxSize": 0,
        "mimeTypes": [],
        "name": "fechaCompletado",
        "presentable": false,
        "protected": false,
        "required": false,
        "system": false,
        "thumbs": [],
        "type": "file"
      },
      {
        "hidden": false,
        "id": "date3389700312",
        "max": "",
        "min": "",
        "name": "fechaProgramada",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "date"
      },
      {
        "cascadeDelete": false,
        "collectionId": "_pb_users_auth_",
        "hidden": false,
        "id": "relation2380864822",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "asignadoA",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": false,
        "collectionId": "pbc_3876073281",
        "hidden": false,
        "id": "relation3495561301",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "tandaPagoId",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": false,
        "collectionId": "pbc_128263769",
        "hidden": false,
        "id": "relation1140324512",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "cobradorId",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text739398485",
        "max": 0,
        "min": 0,
        "name": "horaEstimada",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "number1587687510",
        "max": null,
        "min": null,
        "name": "montoCobrado",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "json2244700430",
        "maxSize": 0,
        "name": "ubicacionCliente",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "json"
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
    "id": "pbc_637990001",
    "indexes": [],
    "listRule": "@request.auth.role = \"admin\"",
    "name": "cobros",
    "system": false,
    "type": "base",
    "updateRule": "@request.auth.role = \"admin\"",
    "viewRule": "@request.auth.role = \"admin\""
  });

  return app.save(collection);
})
