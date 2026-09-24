/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
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
        "cascadeDelete": false,
        "collectionId": "_pb_users_auth_",
        "hidden": false,
        "id": "relation1689669068",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "userId",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text982552870",
        "max": 0,
        "min": 0,
        "name": "nombre",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "exceptDomains": null,
        "hidden": false,
        "id": "email3885137012",
        "name": "email",
        "onlyDomains": null,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "email"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text3253144191",
        "max": 0,
        "min": 0,
        "name": "telefono",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "select1882004807",
        "maxSelect": 1,
        "name": "tipo",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "select",
        "values": [
          "boda",
          "xv",
          "cumple",
          "bautizo",
          "otro"
        ]
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text2557270194",
        "max": 0,
        "min": 0,
        "name": "tipoLabel",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "select3768007251",
        "maxSelect": 1,
        "name": "estilo",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "select",
        "values": [
          "clasico",
          "moderno",
          "minimalista",
          "floral",
          "elegante",
          "divertido"
        ]
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text2304872363",
        "max": 0,
        "min": 0,
        "name": "estiloLabel",
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
        "id": "text3909445466",
        "max": 0,
        "min": 0,
        "name": "nombreEvento",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "date1591856141",
        "max": "",
        "min": "",
        "name": "fechaEvento",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "date"
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
        "hidden": false,
        "id": "select643686883",
        "maxSelect": 1,
        "name": "estado",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "select",
        "values": [
          "pendiente",
          "contactado",
          "en_diseno",
          "aprobado",
          "entregado",
          "cancelado"
        ]
      },
      {
        "hidden": false,
        "id": "number590603631",
        "max": null,
        "min": null,
        "name": "precioFinal",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text2835243259",
        "max": 0,
        "min": 0,
        "name": "notasAdmin",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "date3935866176",
        "max": "",
        "min": "",
        "name": "fechaContacto",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "date"
      },
      {
        "hidden": false,
        "id": "date3954161310",
        "max": "",
        "min": "",
        "name": "fechaEntrega",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "date"
      },
      {
        "hidden": false,
        "id": "file3915979892",
        "maxSelect": 1,
        "maxSize": 0,
        "mimeTypes": [],
        "name": "archivoDiseno",
        "presentable": false,
        "protected": false,
        "required": false,
        "system": false,
        "thumbs": [],
        "type": "file"
      },
      {
        "hidden": false,
        "id": "bool2882213148",
        "name": "activo",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
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
    "id": "pbc_236497258",
    "indexes": [],
    "listRule": "@request.auth.role = \"admin\" || userId = @request.auth.id",
    "name": "solicitudes_invitaciones",
    "system": false,
    "type": "base",
    "updateRule": "@request.auth.role = \"admin\"",
    "viewRule": "@request.auth.role = \"admin\" || userId = @request.auth.id"
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_236497258");

  return app.delete(collection);
})
