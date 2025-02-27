import { makeStyles } from '@material-ui/core/styles'
import classnames from 'classnames'
import { useFormikContext, Form, Formik, Field as FormikField } from 'formik'
import * as R from 'ramda'
import React, { useState, memo } from 'react'
import PromptWhenDirty from 'src/components/PromptWhenDirty'
import { H4 } from 'src/components/typography'
import EditIconDisabled from 'src/styling/icons/action/edit/disabled.svg?react'
import EditIcon from 'src/styling/icons/action/edit/enabled.svg?react'
import FalseIcon from 'src/styling/icons/table/false.svg?react'
import TrueIcon from 'src/styling/icons/table/true.svg?react'
import * as Yup from 'yup'

import { Link, IconButton } from 'src/components/buttons'
import { RadioGroup } from 'src/components/inputs/formik'
import { Table, TableBody, TableRow, TableCell } from 'src/components/table'

import { booleanPropertiesTableStyles } from './BooleanPropertiesTable.styles'

const useStyles = makeStyles(booleanPropertiesTableStyles)

const BooleanCell = ({ name }) => {
  const { values } = useFormikContext()
  return values[name] === 'true' ? <TrueIcon /> : <FalseIcon />
}

const BooleanPropertiesTable = memo(
  ({ title, disabled, data, elements, save, forcedEditing = false }) => {
    const initialValues = R.fromPairs(
      elements.map(it => [it.name, data[it.name]?.toString() ?? 'false'])
    )

    const validationSchema = Yup.object().shape(
      R.fromPairs(
        elements.map(it => [
          it.name,
          Yup.mixed().oneOf(['true', 'false', true, false]).required()
        ])
      )
    )

    const [editing, setEditing] = useState(forcedEditing)

    const classes = useStyles()

    const innerSave = async values => {
      const toBoolean = (num, _) => R.equals(num, 'true')
      save(R.mapObjIndexed(toBoolean, R.filter(R.complement(R.isNil))(values)))
      setEditing(false)
    }

    const radioButtonOptions = [
      { display: 'Yes', code: 'true' },
      { display: 'No', code: 'false' }
    ]
    return (
      <div className={classes.booleanPropertiesTableWrapper}>
        <Formik
          validateOnBlur={false}
          validateOnChange={false}
          enableReinitialize
          onSubmit={innerSave}
          initialValues={initialValues}
          validationSchema={validationSchema}>
          {({ resetForm }) => {
            return (
              <Form>
                <div className={classes.rowWrapper}>
                  <H4>{title}</H4>
                  {editing ? (
                    <div className={classes.rightAligned}>
                      <Link type="submit" color="primary">
                        Save
                      </Link>
                      <Link
                        type="reset"
                        className={classes.rightLink}
                        onClick={() => {
                          resetForm()
                          setEditing(false)
                        }}
                        color="secondary">
                        Cancel
                      </Link>
                    </div>
                  ) : (
                    <IconButton
                      className={classes.transparentButton}
                      onClick={() => setEditing(true)}>
                      {disabled ? <EditIconDisabled /> : <EditIcon />}
                    </IconButton>
                  )}
                </div>
                <PromptWhenDirty />
                <Table className={classes.fillColumn}>
                  <TableBody className={classes.fillColumn}>
                    {elements.map((it, idx) => (
                      <TableRow
                        key={idx}
                        size="sm"
                        className={classes.tableRow}>
                        <TableCell className={classes.leftTableCell}>
                          {it.display}
                        </TableCell>
                        <TableCell className={classes.rightTableCell}>
                          {editing && (
                            <FormikField
                              component={RadioGroup}
                              name={it.name}
                              options={radioButtonOptions}
                              className={classnames(
                                classes.radioButtons,
                                classes.rightTableCell
                              )}
                            />
                          )}
                          {!editing && <BooleanCell name={it.name} />}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Form>
            )
          }}
        </Formik>
      </div>
    )
  }
)

export default BooleanPropertiesTable
