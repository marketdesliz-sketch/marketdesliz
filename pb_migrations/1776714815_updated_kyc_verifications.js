/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_830465610")

  // update field
  collection.fields.addAt(5, new Field({
    "cascadeDelete": false,
    "collectionId": "_pb_users_auth_",
    "hidden": false,
    "id": "relation3366472445",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "reviewedBy",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // update field
  collection.fields.addAt(7, new Field({
    "hidden": false,
    "id": "date1522497736",
    "max": "",
    "min": "",
    "name": "fechaEnvio",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // update field
  collection.fields.addAt(8, new Field({
    "hidden": false,
    "id": "bool1694014235",
    "name": "termsAccepted",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  // update field
  collection.fields.addAt(9, new Field({
    "hidden": false,
    "id": "file825769008",
    "maxSelect": 1,
    "maxSize": 0,
    "mimeTypes": [],
    "name": "termsAcceptedAt",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  // update field
  collection.fields.addAt(12, new Field({
    "hidden": false,
    "id": "file3880719953",
    "maxSelect": 1,
    "maxSize": 0,
    "mimeTypes": [],
    "name": "fechaActualizacion",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  // update field
  collection.fields.addAt(13, new Field({
    "hidden": false,
    "id": "file2759241399",
    "maxSelect": 1,
    "maxSize": 0,
    "mimeTypes": [],
    "name": "comprobanteDomicilio",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  // update field
  collection.fields.addAt(14, new Field({
    "hidden": false,
    "id": "file938793416",
    "maxSelect": 1,
    "maxSize": 0,
    "mimeTypes": [],
    "name": "fechaNacimiento",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  // update field
  collection.fields.addAt(15, new Field({
    "hidden": false,
    "id": "file2341479303",
    "maxSelect": 1,
    "maxSize": 0,
    "mimeTypes": [],
    "name": "fechaSolicitud",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  // update field
  collection.fields.addAt(16, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2034696208",
    "max": 0,
    "min": 0,
    "name": "motivoRechazo",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_830465610")

  // update field
  collection.fields.addAt(5, new Field({
    "cascadeDelete": false,
    "collectionId": "_pb_users_auth_",
    "hidden": false,
    "id": "relation3366472445",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "revisado_por",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // update field
  collection.fields.addAt(7, new Field({
    "hidden": false,
    "id": "date1522497736",
    "max": "",
    "min": "",
    "name": "fecha_envio",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // update field
  collection.fields.addAt(8, new Field({
    "hidden": false,
    "id": "bool1694014235",
    "name": "terminos_aceptados",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  // update field
  collection.fields.addAt(9, new Field({
    "hidden": false,
    "id": "file825769008",
    "maxSelect": 1,
    "maxSize": 0,
    "mimeTypes": [],
    "name": "fecha_aceptacion_terminos",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  // update field
  collection.fields.addAt(12, new Field({
    "hidden": false,
    "id": "file3880719953",
    "maxSelect": 1,
    "maxSize": 0,
    "mimeTypes": [],
    "name": "fecha_actualizacion",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  // update field
  collection.fields.addAt(13, new Field({
    "hidden": false,
    "id": "file2759241399",
    "maxSelect": 1,
    "maxSize": 0,
    "mimeTypes": [],
    "name": "comprobante_domicilio",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  // update field
  collection.fields.addAt(14, new Field({
    "hidden": false,
    "id": "file938793416",
    "maxSelect": 1,
    "maxSize": 0,
    "mimeTypes": [],
    "name": "fecha_nacimiento",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  // update field
  collection.fields.addAt(15, new Field({
    "hidden": false,
    "id": "file2341479303",
    "maxSelect": 1,
    "maxSize": 0,
    "mimeTypes": [],
    "name": "fecha_solicitud",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  // update field
  collection.fields.addAt(16, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2034696208",
    "max": 0,
    "min": 0,
    "name": "motivo_rechazo",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
})
