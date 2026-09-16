/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    // Add permissoes JSON field if not existing
    if (!users.fields.getByName('permissoes')) {
      users.fields.add(
        new JSONField({
          name: 'permissoes',
          required: false,
        }),
      )
      app.save(users)
    }
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    const field = users.fields.getByName('permissoes')
    if (field) {
      users.fields.remove(field)
      app.save(users)
    }
  },
)
