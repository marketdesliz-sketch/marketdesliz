/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_4130758584")

  // remove field
  collection.fields.removeById("text2866418322")

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4130758584")

  // add field
  collection.fields.addAt(3, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2866418322",
    "max": 0,
    "min": 0,
    "name": "usuarioNombre",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
})
