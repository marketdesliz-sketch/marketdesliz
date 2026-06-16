/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": "@request.auth.rol = \"admin\"",
    "deleteRule": null,
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
        "collectionId": "pbc_2604406982",
        "hidden": false,
        "id": "relation3748578879",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "vendedorId",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": false,
        "collectionId": "pbc_4075287140",
        "hidden": false,
        "id": "relation3103014777",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "solicitudId",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
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
          "nueva_solicitud",
          "recordatorio",
          "sistema"
        ]
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text393297498",
        "max": 0,
        "min": 0,
        "name": "titulo",
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
        "id": "text2606963969",
        "max": 0,
        "min": 0,
        "name": "mensaje",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "bool3929695650",
        "name": "leida",
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
    "id": "pbc_506777218",
    "indexes": [],
    "listRule": "vendedorId = @request.auth.id || @request.auth.rol = \"admin\"",
    "name": "notificaciones_vendedor",
    "system": false,
    "type": "base",
    "updateRule": "vendedorId = @request.auth.id",
    "viewRule": "vendedorId = @request.auth.id || @request.auth.rol = \"admin\""
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_506777218");

  return app.delete(collection);
})
