import { Field } from 'formik'
import * as R from 'ramda'
import React from 'react'
import TextInputFormik from 'src/components/inputs/formik/TextInput'
import { H4, P } from 'src/components/typography'
import * as Yup from 'yup'

const NameOfRequirement = () => {
  return (
    <>
      <H4>Name of the requirement</H4> {/* TODO Add ? icon */}
      <P>
        The name of the requirement will only be visible to you on the dashboard
        on the requirement list, as well as on the custom information request
        list. The user won't see this name. Make sure to make it distinguishable
        and short.
      </P>
      <Field
        component={TextInputFormik}
        label="Requirement name"
        name="requirementName"
        fullWidth
      />
    </>
  )
}

const validationSchema = existingRequirements =>
  Yup.object().shape({
    requirementName: Yup.string()
      .required('Name is required')
      .test(
        'unique-name',
        'A custom information requirement with that name already exists',
        (value, _context) =>
          !R.includes(
            R.toLower(R.defaultTo('', value)),
            R.map(it => R.toLower(it.customRequest.name), existingRequirements)
          )
      )
  })

const defaultValues = {
  requirementName: ''
}

export default NameOfRequirement
export { validationSchema, defaultValues }
