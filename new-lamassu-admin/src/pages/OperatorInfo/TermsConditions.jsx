import { useQuery, useMutation } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core'
import classnames from 'classnames'
import { Form, Formik, Field as FormikField } from 'formik'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState } from 'react'
import ErrorMessage from 'src/components/ErrorMessage'
import PromptWhenDirty from 'src/components/PromptWhenDirty'
import { HelpTooltip } from 'src/components/Tooltip'
import { H4, Info2, Info3, Label2, Label3, P } from 'src/components/typography'
import EditIcon from 'src/styling/icons/action/edit/enabled.svg?react'
import * as Yup from 'yup'

import { Link, IconButton, SupportLinkButton } from 'src/components/buttons'
import { Switch } from 'src/components/inputs'
import { TextInput } from 'src/components/inputs/formik'
import { fromNamespace, toNamespace, namespaces } from 'src/utils/config'

import { global, fieldStyles } from './OperatorInfo.styles'

const useFieldStyles = makeStyles(fieldStyles)

const Field = ({
  editing,
  name,
  width,
  placeholder,
  label,
  value,
  multiline = false,
  rows,
  onFocus,
  ...props
}) => {
  const classes = useFieldStyles()

  const classNames = {
    [classes.field]: true,
    [classes.notEditing]: !editing,
    [classes.notEditingSingleLine]: !editing && !multiline,
    [classes.notEditingMultiline]: !editing && multiline
  }

  return (
    <div className={classnames(classNames)}>
      {!editing && (
        <>
          <Label3>{label}</Label3>
          <Info3>{value}</Info3>
        </>
      )}
      {editing && (
        <FormikField
          id={name}
          name={name}
          component={TextInput}
          width={width}
          placeholder={placeholder}
          type="text"
          label={label}
          multiline={multiline}
          rows={rows}
          rowsMax="6"
          onFocus={onFocus}
          {...props}
        />
      )}
    </div>
  )
}

const GET_CONFIG = gql`
  query getData {
    config
  }
`

const SAVE_CONFIG = gql`
  mutation Save($config: JSONObject) {
    saveConfig(config: $config)
  }
`

const useTermsConditionsStyles = makeStyles(global)

const TermsConditions = () => {
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(false)
  const [saveConfig] = useMutation(SAVE_CONFIG, {
    onCompleted: () => {
      setError(null)
      setEditing(false)
    },
    refetchQueries: () => ['getData'],
    onError: e => setError(e)
  })

  const classes = useTermsConditionsStyles()

  const { data } = useQuery(GET_CONFIG)

  const termsAndConditions =
    data?.config && fromNamespace(namespaces.TERMS_CONDITIONS, data.config)
  const formData = termsAndConditions ?? {}
  const showOnScreen = termsAndConditions?.active ?? false
  const addDelayOnScreen = termsAndConditions?.delay ?? false
  const tcPhoto = termsAndConditions?.tcPhoto ?? false

  const save = it =>
    saveConfig({
      variables: { config: toNamespace(namespaces.TERMS_CONDITIONS, it) }
    })

  const fields = [
    {
      name: 'title',
      label: 'Screen title',
      value: formData.title ?? '',
      width: 282
    },
    {
      name: 'text',
      label: 'Text content',
      value: formData.text ?? '',
      width: 502,
      multiline: true,
      rows: 6
    },
    {
      name: 'acceptButtonText',
      label: 'Accept button text',
      value: formData.acceptButtonText ?? '',
      placeholder: 'I accept',
      width: 282
    },
    {
      name: 'cancelButtonText',
      label: 'Cancel button text',
      value: formData.cancelButtonText ?? '',
      placeholder: 'Cancel',
      width: 282
    }
  ]

  const findField = name => R.find(R.propEq('name', name))(fields)
  const findValue = name => findField(name).value

  const initialValues = {
    title: findValue('title'),
    text: findValue('text'),
    acceptButtonText: findValue('acceptButtonText'),
    cancelButtonText: findValue('cancelButtonText')
  }

  const validationSchema = Yup.object().shape({
    title: Yup.string('The screen title must be a string')
      .required('The screen title is required')
      .max(50, 'Too long'),
    text: Yup.string('The text content must be a string').required(
      'The text content is required'
    ),
    acceptButtonText: Yup.string('The accept button text must be a string')
      .required('The accept button text is required')
      .max(50, 'The accept button text is too long'),
    cancelButtonText: Yup.string('The cancel button text must be a string')
      .required('The cancel button text is required')
      .max(50, 'The cancel button text is too long')
  })

  return (
    <>
      <div className={classes.header}>
        <H4>Terms &amp; Conditions</H4>
        <HelpTooltip width={320}>
          <P>
            For details on configuring this panel, please read the relevant
            knowledgebase article:
          </P>
          <SupportLinkButton
            link="https://support.lamassu.is/hc/en-us/articles/360015982211-Terms-and-Conditions"
            label="Lamassu Support Article"
            bottomSpace="1"
          />
        </HelpTooltip>
      </div>
      <div className={classes.switchRow}>
        <P>Show on screen</P>
        <div className={classes.switch}>
          <Switch
            checked={showOnScreen}
            onChange={event =>
              save({
                active: event.target.checked
              })
            }
          />
          <Label2>{showOnScreen ? 'Yes' : 'No'}</Label2>
        </div>
      </div>
      <div className={classes.switchRow}>
        <P>
          Capture customer photo on acceptance <br /> of Terms & Conditions
          screen
        </P>
        <div className={classes.switch}>
          <Switch
            checked={tcPhoto}
            onChange={event =>
              save({
                tcPhoto: event.target.checked
              })
            }
          />
          <Label2>{tcPhoto ? 'Yes' : 'No'}</Label2>
        </div>
      </div>
      <div className={classes.switchRow}>
        <P>Add 7 seconds delay on screen</P>
        <div className={classes.switch}>
          <Switch
            checked={addDelayOnScreen}
            onChange={event =>
              save({
                delay: event.target.checked
              })
            }
          />
          <Label2>{addDelayOnScreen ? 'Yes' : 'No'}</Label2>
        </div>
      </div>
      <div className={classes.header}>
        <Info2>Info card</Info2>
        {!editing && (
          <IconButton
            className={classes.transparentButton}
            onClick={() => setEditing(true)}>
            <EditIcon />
          </IconButton>
        )}
      </div>
      <Formik
        validateOnBlur={false}
        validateOnChange={false}
        enableReinitialize
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={values => save(values)}
        onReset={() => {
          setEditing(false)
          setError(null)
        }}>
        {({ errors }) => (
          <Form>
            <PromptWhenDirty />
            {fields.map((f, idx) => (
              <div className={classes.row} key={idx}>
                <Field
                  editing={editing}
                  name={f.name}
                  width={f.width}
                  placeholder={f.placeholder}
                  label={f.label}
                  value={f.value}
                  multiline={f.multiline}
                  rows={f.rows}
                  onFocus={() => setError(null)}
                />
              </div>
            ))}
            <div className={classnames(classes.row, classes.submit)}>
              {editing && (
                <>
                  <Link color="primary" type="submit">
                    Save
                  </Link>
                  <Link color="secondary" type="reset">
                    Cancel
                  </Link>
                  {!R.isEmpty(errors) && (
                    <ErrorMessage>{R.head(R.values(errors))}</ErrorMessage>
                  )}
                  {error && <ErrorMessage>Failed to save changes</ErrorMessage>}
                </>
              )}
            </div>
          </Form>
        )}
      </Formik>
    </>
  )
}

export default TermsConditions
