/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2221004732");

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
        "hidden": false,
        "id": "select1882004807",
        "maxSelect": 1,
        "name": "tipo",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "select",
        "values": [
          "nivel_up",
          "tanda_disponible",
          "limite_alcanzado"
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
    "id": "pbc_2221004732",
    "indexes": [],
    "listRule": "clienteId = @request.auth.id || @request.auth.role = \"admin\"",
    "name": "notificaciones_cliente",
    "system": false,
    "type": "base",
    "updateRule": "clienteId = @request.auth.id",
    "viewRule": "clienteId = @request.auth.id || @request.auth.role = \"admin\""
  });

  return app.save(collection);
})
