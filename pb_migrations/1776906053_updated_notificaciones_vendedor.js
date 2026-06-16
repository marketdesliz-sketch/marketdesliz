/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_506777218")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.role = \"admin\" || @request.auth.id != \"\"",
    "listRule": "usuarioId = @request.auth.id || @request.auth.role = \"admin\"\n",
    "name": "notificaciones",
    "updateRule": "usuarioId = @request.auth.id",
    "viewRule": "usuarioId = @request.auth.id || @request.auth.role = \"admin\""
  }, collection)

  // remove field
  collection.fields.removeById("relation3748578879")

  // remove field
  collection.fields.removeById("relation3103014777")

  // add field
  collection.fields.addAt(5, new Field({
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
  }))

  // add field
  collection.fields.addAt(6, new Field({
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
  }))

  // add field
  collection.fields.addAt(7, new Field({
    "hidden": false,
    "id": "date3342091366",
    "max": "",
    "min": "",
    "name": "leidaEn",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // add field
  collection.fields.addAt(8, new Field({
    "hidden": false,
    "id": "json1369121172",
    "maxSize": 0,
    "name": "datos",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  // add field
  collection.fields.addAt(9, new Field({
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
  }))

  // add field
  collection.fields.addAt(10, new Field({
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
  }))

  // update field
  collection.fields.addAt(1, new Field({
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
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_506777218")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.role = \"admin\"",
    "listRule": "vendedorId = @request.auth.id || @request.auth.role = \"admin\"",
    "name": "notificaciones_vendedor",
    "updateRule": "vendedorId = @request.auth.id",
    "viewRule": "vendedorId = @request.auth.id || @request.auth.role = \"admin\""
  }, collection)

  // add field
  collection.fields.addAt(1, new Field({
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
  }))

  // add field
  collection.fields.addAt(2, new Field({
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
  }))

  // remove field
  collection.fields.removeById("relation4006211842")

  // remove field
  collection.fields.removeById("select2169673818")

  // remove field
  collection.fields.removeById("date3342091366")

  // remove field
  collection.fields.removeById("json1369121172")

  // remove field
  collection.fields.removeById("text3386030972")

  // remove field
  collection.fields.removeById("text3329859325")

  // update field
  collection.fields.addAt(3, new Field({
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
  }))

  return app.save(collection)
})
