/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": "@request.auth.role = \"admin\" || @request.auth.id != \"\"",
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
        "id": "select2169673818",
        "maxSelect": 1,
        "name": "tipoUsuario",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "select",
        "values": [
          "cliente",
          "vendedor",
          "negocio",
          "admin"
        ]
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
          "limite_alcanzado",
          "nueva_solicitud",
          "recordatorio",
          "sistema",
          "comentario",
          "calificacion",
          "contacto",
          "visita"
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
        "id": "date3342091366",
        "max": "",
        "min": "",
        "name": "leidaEn",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "date"
      },
      {
        "hidden": false,
        "id": "json1369121172",
        "maxSize": 0,
        "name": "datos",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "json"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text3386030972",
        "max": 0,
        "min": 0,
        "name": "entidadId",
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
        "id": "text3329859325",
        "max": 0,
        "min": 0,
        "name": "entidadTipo",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
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
    "id": "pbc_555007670",
    "indexes": [],
    "listRule": "usuarioId = @request.auth.id || @request.auth.role = \"admin\"",
    "name": "notificaciones",
    "system": false,
    "type": "base",
    "updateRule": "usuarioId = @request.auth.id",
    "viewRule": "usuarioId = @request.auth.id || @request.auth.role = \"admin\""
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_555007670");

  return app.delete(collection);
})
