import { useQuery, useMutation } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState } from 'react'
import * as Yup from 'yup'

import { IconButton } from 'src/components/buttons'
import { Table as EditableTable } from 'src/components/editableTable'
import { CashOut, CashIn } from 'src/components/inputs/cashbox/Cashbox'
import { NumberInput, CashCassetteInput } from 'src/components/inputs/formik'
import TitleSection from 'src/components/layout/TitleSection'
import { EmptyTable } from 'src/components/table'
import { ReactComponent as EditIcon } from 'src/styling/icons/action/edit/enabled.svg'
import { ReactComponent as ReverseHistoryIcon } from 'src/styling/icons/circle buttons/history/white.svg'
import { ReactComponent as HistoryIcon } from 'src/styling/icons/circle buttons/history/zodiac.svg'
import { fromNamespace } from 'src/utils/config'

import styles from './CashCassettes.styles.js'
import CashCassettesFooter from './CashCassettesFooter'
import CashboxHistory from './CashboxHistory'
import Wizard from './Wizard/Wizard'

const useStyles = makeStyles(styles)

const ValidationSchema = Yup.object().shape({
  name: Yup.string().required(),
  cashbox: Yup.number()
    .label('Cash box')
    .required()
    .integer()
    .min(0)
    .max(1000),
  cassette1: Yup.number()
    .label('Cassette 1')
    .required()
    .integer()
    .min(0)
    .max(500),
  cassette2: Yup.number()
    .label('Cassette 2')
    .required()
    .integer()
    .min(0)
    .max(500),
  cassette3: Yup.number()
    .label('Cassette 3')
    .required()
    .integer()
    .min(0)
    .max(500),
  cassette4: Yup.number()
    .label('Cassette 4')
    .required()
    .integer()
    .min(0)
    .max(500)
})

const GET_MACHINES_AND_CONFIG = gql`
  query getData {
    machines {
      name
      id: deviceId
      cashbox
      cassette1
      cassette2
      cassette3
      cassette4
      numberOfCassettes
    }
    config
  }
`

/* 
  // for cash in total calculation
  bills {
    fiat
    deviceId
    created
    cashbox
  }
*/

const SET_CASSETTE_BILLS = gql`
  mutation MachineAction(
    $deviceId: ID!
    $action: MachineAction!
    $cashbox: Int!
    $cassette1: Int!
    $cassette2: Int!
    $cassette3: Int!
    $cassette4: Int!
  ) {
    machineAction(
      deviceId: $deviceId
      action: $action
      cashbox: $cashbox
      cassette1: $cassette1
      cassette2: $cassette2
      cassette3: $cassette3
      cassette4: $cassette4
    ) {
      deviceId
      cashbox
      cassette1
      cassette2
      cassette3
      cassette4
    }
  }
`

const CashCassettes = () => {
  const classes = useStyles()
  const [showHistory, setShowHistory] = useState(false)

  const { data } = useQuery(GET_MACHINES_AND_CONFIG)
  const [wizard, setWizard] = useState(false)
  const [machineId, setMachineId] = useState('')

  const machines = R.path(['machines'])(data) ?? []
  const config = R.path(['config'])(data) ?? {}
  const [setCassetteBills, { error }] = useMutation(SET_CASSETTE_BILLS, {
    refetchQueries: () => ['getData']
  })
  const bills = R.groupBy(bill => bill.deviceId)(R.path(['bills'])(data) ?? [])
  const deviceIds = R.uniq(
    R.map(R.prop('deviceId'))(R.path(['bills'])(data) ?? [])
  )
  const cashout = data?.config && fromNamespace('cashOut')(data.config)
  const locale = data?.config && fromNamespace('locale')(data.config)
  const fiatCurrency = locale?.fiatCurrency
  const maxNumberOfCassettes = Math.max(
    ...R.map(it => it.numberOfCassettes, machines),
    0
  )

  const getCashoutSettings = id => fromNamespace(id)(cashout)
  const isCashOutDisabled = ({ id }) => !getCashoutSettings(id).active

  const onSave = (id, cashbox, cassettes) => {
    return setCassetteBills({
      variables: {
        action: 'setCassetteBills',
        deviceId: id,
        cashbox,
        ...cassettes
      }
    })
  }

  const elements = [
    {
      name: 'name',
      header: 'Machine',
      width: 184,
      view: name => <>{name}</>,
      input: ({ field: { value: name } }) => <>{name}</>
    },
    {
      name: 'cashbox',
      header: 'Cash box',
      width: maxNumberOfCassettes > 2 ? 140 : 280,
      view: value => (
        <CashIn currency={{ code: fiatCurrency }} notes={value} total={0} />
      ),
      input: NumberInput,
      inputProps: {
        decimalPlaces: 0
      }
    }
  ]

  R.until(
    R.gt(R.__, maxNumberOfCassettes),
    it => {
      elements.push({
        name: `cassette${it}`,
        header: `Cassette ${it}`,
        width: (maxNumberOfCassettes > 2 ? 700 : 560) / maxNumberOfCassettes,
        stripe: true,
        doubleHeader: 'Cash-out',
        view: (value, { id }) => (
          <CashOut
            className={classes.cashbox}
            denomination={getCashoutSettings(id)?.[`cassette${it}`]}
            currency={{ code: fiatCurrency }}
            notes={value}
            width={50}
          />
        ),
        isHidden: ({ numberOfCassettes }) => it > numberOfCassettes,
        input: CashCassetteInput,
        inputProps: {
          decimalPlaces: 0,
          width: 50,
          inputClassName: classes.cashbox
        }
      })
      return R.add(1, it)
    },
    1
  )

  elements.push({
    name: 'edit',
    header: 'Edit',
    width: 87,
    view: (value, { id }) => {
      return (
        <IconButton
          onClick={() => {
            setMachineId(id)
            setWizard(true)
          }}>
          <EditIcon />
        </IconButton>
      )
    }
  })

  return (
    <>
      <TitleSection
        title="Cash Boxes & Cassettes"
        button={{
          text: 'Cash box history',
          icon: HistoryIcon,
          inverseIcon: ReverseHistoryIcon,
          toggle: setShowHistory
        }}
        iconClassName={classes.listViewButton}
      />
      <div className={classes.tableContainer}>
        {!showHistory && (
          <>
            <EditableTable
              error={error?.message}
              name="cashboxes"
              stripeWhen={isCashOutDisabled}
              elements={elements}
              data={machines}
              validationSchema={ValidationSchema}
              tbodyWrapperClass={classes.tBody}
            />

            {data && R.isEmpty(machines) && (
              <EmptyTable message="No machines so far" />
            )}
          </>
        )}
        {showHistory && (
          <CashboxHistory machines={machines} currency={fiatCurrency} />
        )}
      </div>
      <CashCassettesFooter
        currencyCode={fiatCurrency}
        machines={machines}
        config={config}
        bills={bills}
        deviceIds={deviceIds}
      />
      {wizard && (
        <Wizard
          machine={R.find(R.propEq('id', machineId), machines)}
          cashoutSettings={getCashoutSettings(machineId)}
          onClose={() => {
            setWizard(false)
          }}
          error={error?.message}
          save={onSave}
          locale={locale}
        />
      )}
    </>
  )
}

export default CashCassettes
