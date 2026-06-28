/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1928099433")

  // add field
  collection.fields.addAt(17, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2560465762",
    "max": 0,
    "min": 0,
    "name": "slug",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(18, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_338743873",
    "hidden": false,
    "id": "relation1881039220",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "categoriaNegocioId",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // add field
  collection.fields.addAt(19, new Field({
    "exceptDomains": null,
    "hidden": false,
    "id": "email3885137012",
    "name": "email",
    "onlyDomains": null,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "email"
  }))

  // add field
  collection.fields.addAt(20, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text3972160049",
    "max": 0,
    "min": 0,
    "name": "sitioWeb",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(21, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text1802815712",
    "max": 0,
    "min": 0,
    "name": "facebook",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(22, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2225635011",
    "max": 0,
    "min": 0,
    "name": "instagram",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(23, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text847873150",
    "max": 0,
    "min": 0,
    "name": "tiktok",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(24, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_3011010242",
    "hidden": false,
    "id": "relation2296584046",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "estadoId",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // add field
  collection.fields.addAt(25, new Field({
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
  }))

  // add field
  collection.fields.addAt(26, new Field({
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
  }))

  // add field
  collection.fields.addAt(27, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_3115953589",
    "hidden": false,
    "id": "relation1125456837",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "sectorId",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // add field
  collection.fields.addAt(28, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text1834306610",
    "max": 0,
    "min": 0,
    "name": "codigoPostal",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(29, new Field({
    "hidden": false,
    "id": "number331428840",
    "max": null,
    "min": null,
    "name": "latitud",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(30, new Field({
    "hidden": false,
    "id": "number2335556369",
    "max": null,
    "min": null,
    "name": "longitud",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(31, new Field({
    "hidden": false,
    "id": "json3229515823",
    "maxSize": 0,
    "name": "servicios",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  // add field
  collection.fields.addAt(32, new Field({
    "hidden": false,
    "id": "bool2888042666",
    "name": "atencionWhatsapp",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  // add field
  collection.fields.addAt(33, new Field({
    "hidden": false,
    "id": "bool296763027",
    "name": "citasPrevias",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  // add field
  collection.fields.addAt(34, new Field({
    "hidden": false,
    "id": "bool2336917078",
    "name": "domiciliobool",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  // add field
  collection.fields.addAt(35, new Field({
    "hidden": false,
    "id": "bool149361778",
    "name": "verificado",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  // add field
  collection.fields.addAt(36, new Field({
    "cascadeDelete": false,
    "collectionId": "_pb_users_auth_",
    "hidden": false,
    "id": "relation2284227682",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "verificadoPor",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // add field
  collection.fields.addAt(37, new Field({
    "hidden": false,
    "id": "date2506050510",
    "max": "",
    "min": "",
    "name": "fechaVerificacion",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // add field
  collection.fields.addAt(38, new Field({
    "hidden": false,
    "id": "bool720804565",
    "name": "destacado",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  // add field
  collection.fields.addAt(39, new Field({
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
  }))

  // add field
  collection.fields.addAt(40, new Field({
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
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1928099433")

  // remove field
  collection.fields.removeById("text2560465762")

  // remove field
  collection.fields.removeById("relation1881039220")

  // remove field
  collection.fields.removeById("email3885137012")

  // remove field
  collection.fields.removeById("text3972160049")

  // remove field
  collection.fields.removeById("text1802815712")

  // remove field
  collection.fields.removeById("text2225635011")

  // remove field
  collection.fields.removeById("text847873150")

  // remove field
  collection.fields.removeById("relation2296584046")

  // remove field
  collection.fields.removeById("relation3105114133")

  // remove field
  collection.fields.removeById("relation3228957875")

  // remove field
  collection.fields.removeById("relation1125456837")

  // remove field
  collection.fields.removeById("text1834306610")

  // remove field
  collection.fields.removeById("number331428840")

  // remove field
  collection.fields.removeById("number2335556369")

  // remove field
  collection.fields.removeById("json3229515823")

  // remove field
  collection.fields.removeById("bool2888042666")

  // remove field
  collection.fields.removeById("bool296763027")

  // remove field
  collection.fields.removeById("bool2336917078")

  // remove field
  collection.fields.removeById("bool149361778")

  // remove field
  collection.fields.removeById("relation2284227682")

  // remove field
  collection.fields.removeById("date2506050510")

  // remove field
  collection.fields.removeById("bool720804565")

  // remove field
  collection.fields.removeById("number3841207618")

  // remove field
  collection.fields.removeById("number2319118872")

  return app.save(collection)
})
