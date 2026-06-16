/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_4092854851")

  // remove field
  collection.fields.removeById("text232563784")

  // add field
  collection.fields.addAt(11, new Field({
    "hidden": false,
    "id": "select232563784",
    "maxSelect": 1,
    "name": "subcategory",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "Refrigeradores",
      "Lavadoras"
    ]
  }))

  // add field
  collection.fields.addAt(12, new Field({
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
  collection.fields.addAt(13, new Field({
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

  // update field
  collection.fields.addAt(10, new Field({
    "hidden": false,
    "id": "select105650625",
    "maxSelect": 1,
    "name": "category",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "Electrodomésticos",
      "Hogar",
      "Cocina",
      "Electrónica"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4092854851")

  // add field
  collection.fields.addAt(11, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text232563784",
    "max": 0,
    "min": 0,
    "name": "subcategory",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // remove field
  collection.fields.removeById("select232563784")

  // remove field
  collection.fields.removeById("number1261852256")

  // remove field
  collection.fields.removeById("text261109956")

  // update field
  collection.fields.addAt(10, new Field({
    "hidden": false,
    "id": "select105650625",
    "maxSelect": 1,
    "name": "category",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "productos",
      "servicios",
      "uso-personal",
      "ganado",
      "instrumentos",
      "tandas"
    ]
  }))

  return app.save(collection)
})
