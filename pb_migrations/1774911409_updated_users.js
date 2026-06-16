/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // add field
  collection.fields.addAt(13, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2120499480",
    "max": 15,
    "min": 10,
    "name": "telefono_alternativo",
    "pattern": "^\\d{10,15}$",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(14, new Field({
    "hidden": false,
    "id": "select2212330713",
    "maxSelect": 1,
    "name": "dia_pago",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "lunes",
      "martes"
    ]
  }))

  // add field
  collection.fields.addAt(15, new Field({
    "hidden": false,
    "id": "bool2765776105",
    "name": "datos_completos",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  // add field
  collection.fields.addAt(16, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2477447202",
    "max": 200,
    "min": 0,
    "name": "direccion_calle",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(17, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text1106018968",
    "max": 50,
    "min": 0,
    "name": "direccion_numero",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(18, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text3906025657",
    "max": 50,
    "min": 0,
    "name": "direccion_interior",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(19, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text3288546764",
    "max": 150,
    "min": 0,
    "name": "direccion_colonia",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(20, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2529666875",
    "max": 150,
    "min": 0,
    "name": "direccion_municipio",
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
    "id": "text976250520",
    "max": 150,
    "min": 0,
    "name": "direccion_ciudad",
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
    "id": "text2464908005",
    "max": 150,
    "min": 0,
    "name": "direccion_estado",
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
    "id": "text3980347168",
    "max": 10,
    "min": 0,
    "name": "direccion_cp",
    "pattern": "^\\d{5}$",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(24, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text1953481645",
    "max": 500,
    "min": 0,
    "name": "direccion_referencias",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(25, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text3253144191",
    "max": 15,
    "min": 10,
    "name": "telefono",
    "pattern": "^\\d{10,15}$",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // remove field
  collection.fields.removeById("text2120499480")

  // remove field
  collection.fields.removeById("select2212330713")

  // remove field
  collection.fields.removeById("bool2765776105")

  // remove field
  collection.fields.removeById("text2477447202")

  // remove field
  collection.fields.removeById("text1106018968")

  // remove field
  collection.fields.removeById("text3906025657")

  // remove field
  collection.fields.removeById("text3288546764")

  // remove field
  collection.fields.removeById("text2529666875")

  // remove field
  collection.fields.removeById("text976250520")

  // remove field
  collection.fields.removeById("text2464908005")

  // remove field
  collection.fields.removeById("text3980347168")

  // remove field
  collection.fields.removeById("text1953481645")

  // remove field
  collection.fields.removeById("text3253144191")

  return app.save(collection)
})
