/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // add field
  collection.fields.addAt(11, new Field({
    "hidden": false,
    "id": "select2462348188",
    "maxSelect": 1,
    "name": "provider",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "phone",
      "google"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // remove field
  collection.fields.removeById("select2462348188")

  return app.save(collection)
})
