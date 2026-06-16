/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_4092854851")

  // add field
  collection.fields.addAt(1, new Field({
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
  }))

  // add field
  collection.fields.addAt(2, new Field({
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
  }))

  // add field
  collection.fields.addAt(3, new Field({
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
  }))

  // add field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "number3139177447",
    "max": null,
    "min": null,
    "name": "costo",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "number2526520864",
    "max": null,
    "min": null,
    "name": "enganche",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(6, new Field({
    "hidden": false,
    "id": "number1222512077",
    "max": null,
    "min": null,
    "name": "pagoSemanal",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(7, new Field({
    "hidden": false,
    "id": "number223229169",
    "max": null,
    "min": null,
    "name": "semanas",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(8, new Field({
    "hidden": false,
    "id": "select2170609155",
    "maxSelect": 1,
    "name": "frecuenciaPago",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "semanal",
      "quincenal"
    ]
  }))

  // add field
  collection.fields.addAt(9, new Field({
    "hidden": false,
    "id": "select1309676077",
    "maxSelect": 1,
    "name": "categoria",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "electronica",
      "hogar",
      "ropa",
      "instrumentos",
      "ganado",
      "servicios"
    ]
  }))

  // add field
  collection.fields.addAt(10, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_2687480828",
    "hidden": false,
    "id": "relation4180551237",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "categoriaId",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // add field
  collection.fields.addAt(11, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text3665803540",
    "max": 0,
    "min": 0,
    "name": "subcategoria",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(12, new Field({
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
  }))

  // add field
  collection.fields.addAt(13, new Field({
    "hidden": false,
    "id": "number1261852256",
    "max": null,
    "min": null,
    "name": "stock",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(14, new Field({
    "hidden": false,
    "id": "number2013513713",
    "max": null,
    "min": null,
    "name": "diasEntrega",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(15, new Field({
    "hidden": false,
    "id": "bool2882213148",
    "name": "activo",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  // add field
  collection.fields.addAt(16, new Field({
    "hidden": false,
    "id": "bool1454753261",
    "name": "nuevo",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  // add field
  collection.fields.addAt(17, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text261109956",
    "max": 0,
    "min": 0,
    "name": "sku",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4092854851")

  // remove field
  collection.fields.removeById("text982552870")

  // remove field
  collection.fields.removeById("text2687119104")

  // remove field
  collection.fields.removeById("number380223906")

  // remove field
  collection.fields.removeById("number3139177447")

  // remove field
  collection.fields.removeById("number2526520864")

  // remove field
  collection.fields.removeById("number1222512077")

  // remove field
  collection.fields.removeById("number223229169")

  // remove field
  collection.fields.removeById("select2170609155")

  // remove field
  collection.fields.removeById("select1309676077")

  // remove field
  collection.fields.removeById("relation4180551237")

  // remove field
  collection.fields.removeById("text3665803540")

  // remove field
  collection.fields.removeById("file2199507635")

  // remove field
  collection.fields.removeById("number1261852256")

  // remove field
  collection.fields.removeById("number2013513713")

  // remove field
  collection.fields.removeById("bool2882213148")

  // remove field
  collection.fields.removeById("bool1454753261")

  // remove field
  collection.fields.removeById("text261109956")

  return app.save(collection)
})
