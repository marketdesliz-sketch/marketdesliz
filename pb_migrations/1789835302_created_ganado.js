/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": "@request.auth.id != \"\"",
    "deleteRule": "@request.auth.id = usuarioId || @request.auth.role = \"admin\"",
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
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text2687119104",
        "max": 0,
        "min": 0,
        "name": "descripcion",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "select1309676077",
        "maxSelect": 1,
        "name": "categoria",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "select",
        "values": [
          "Bovinos",
          "Porcinos",
          "Ovinos",
          "Caprinos",
          "Aves",
          "Equinos",
          "Conejos",
          "Otro"
        ]
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text1174591150",
        "max": 0,
        "min": 0,
        "name": "raza",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "select741955218",
        "maxSelect": 1,
        "name": "sexo",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "select",
        "values": [
          "Macho",
          "Hembra",
          "Mixto"
        ]
      },
      {
        "hidden": false,
        "id": "number827492029",
        "max": null,
        "min": null,
        "name": "edadMeses",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number292074757",
        "max": null,
        "min": null,
        "name": "pesoKg",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number380223906",
        "max": null,
        "min": null,
        "name": "precio",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number319960130",
        "max": null,
        "min": null,
        "name": "precioAnterior",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "select4091990063",
        "maxSelect": 1,
        "name": "unidad",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "select",
        "values": [
          "cabeza",
          "lote",
          "kg",
          "docena"
        ]
      },
      {
        "hidden": false,
        "id": "number400700311",
        "max": null,
        "min": null,
        "name": "cantidad",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "bool3556696361",
        "name": "vacunado",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
      },
      {
        "hidden": false,
        "id": "bool2341150981",
        "name": "certificado",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
      },
      {
        "hidden": false,
        "id": "file2199507635",
        "maxSelect": 1,
        "maxSize": 0,
        "mimeTypes": [],
        "name": "imagen",
        "presentable": false,
        "protected": false,
        "required": false,
        "system": false,
        "thumbs": [],
        "type": "file"
      },
      {
        "hidden": false,
        "id": "file929718273",
        "maxSelect": 99,
        "maxSize": 0,
        "mimeTypes": [],
        "name": "imagenes",
        "presentable": false,
        "protected": false,
        "required": false,
        "system": false,
        "thumbs": [],
        "type": "file"
      },
      {
        "cascadeDelete": false,
        "collectionId": "pbc_1162511638",
        "hidden": false,
        "id": "relation3105114133",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "municipioId",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": false,
        "collectionId": "pbc_2321953198",
        "hidden": false,
        "id": "relation3228957875",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "localidadId",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
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
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text4222712125",
        "max": 0,
        "min": 0,
        "name": "whatsapp",
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
        "id": "bool1454753261",
        "name": "nuevo",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
      },
      {
        "hidden": false,
        "id": "bool720804565",
        "name": "destacado",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
      },
      {
        "hidden": false,
        "id": "number3777548247",
        "max": null,
        "min": null,
        "name": "orden",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number593624199",
        "max": null,
        "min": null,
        "name": "visitas",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number2319118872",
        "max": null,
        "min": null,
        "name": "calificacion",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number3841207618",
        "max": null,
        "min": null,
        "name": "totalComentarios",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "cascadeDelete": false,
        "collectionId": "_pb_users_auth_",
        "hidden": false,
        "id": "relation4006211842",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "usuarioId",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
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
    "id": "pbc_2030194367",
    "indexes": [],
    "listRule": "activo = true",
    "name": "ganado",
    "system": false,
    "type": "base",
    "updateRule": "@request.auth.id = usuarioId || @request.auth.role = \"admin\"",
    "viewRule": ""
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2030194367");

  return app.delete(collection);
})
