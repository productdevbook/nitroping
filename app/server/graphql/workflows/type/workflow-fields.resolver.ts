import { defineField } from 'nitro-graphql/define'

export const workflowFieldsResolver = defineField({
  Workflow: {
    steps: {
      resolve: async (parent, _args, { context }) => {
        const { dataloaders } = context
        return dataloaders.stepsByWorkflowLoader.load(parent.id)
      },
    },
  },
})
