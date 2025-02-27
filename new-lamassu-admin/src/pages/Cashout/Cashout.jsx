import { useQuery, useMutation } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core/styles'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState } from 'react'
import { HelpTooltip } from 'src/components/Tooltip'
import TitleSection from 'src/components/layout/TitleSection'
import { P, Label2 } from 'src/components/typography'

import { SupportLinkButton } from 'src/components/buttons'
import { NamespacedTable as EditableTable } from 'src/components/editableTable'
import { Switch } from 'src/components/inputs'
import { EmptyTable } from 'src/components/table'
import { fromNamespace, toNamespace } from 'src/utils/config'

import Wizard from './Wizard'
import { DenominationsSchema, getElements } from './helper'

const useStyles = makeStyles({
  fudgeFactor: {
    display: 'flex',
    alignItems: 'center'
  },
  switchLabel: {
    margin: 6,
    width: 24
  },
  autoComplete: {
    width: '100%'
  }
})

const SAVE_CONFIG = gql`
  mutation Save($config: JSONObject) {
    saveConfig(config: $config)
  }
`

const GET_INFO = gql`
  query getData {
    machines {
      name
      deviceId
      cashUnits {
        cashbox
        cassette1
        cassette2
        cassette3
        cassette4
        recycler1
        recycler2
        recycler3
        recycler4
        recycler5
        recycler6
      }
      numberOfCassettes
      numberOfRecyclers
    }
    config
  }
`

const CashOut = ({ name: SCREEN_KEY }) => {
  const classes = useStyles()
  const [wizard, setWizard] = useState(false)
  const { data, loading } = useQuery(GET_INFO)

  const [saveConfig, { error }] = useMutation(SAVE_CONFIG, {
    onCompleted: () => setWizard(false),
    refetchQueries: () => ['getData']
  })

  const save = (rawConfig, accounts) => {
    const config = toNamespace(SCREEN_KEY)(rawConfig)
    return saveConfig({ variables: { config, accounts } })
  }

  const config = data?.config && fromNamespace(SCREEN_KEY)(data.config)

  const fudgeFactorActive = config?.fudgeFactorActive ?? false
  const locale = data?.config && fromNamespace('locale')(data.config)
  const machines = data?.machines ?? []

  const onToggle = id => {
    const namespaced = fromNamespace(id)(config)
    if (!DenominationsSchema.isValidSync(namespaced)) return setWizard(id)
    save(toNamespace(id, { active: !namespaced?.active }))
  }

  const wasNeverEnabled = it => R.compose(R.length, R.keys)(it) === 1

  return (
    !loading && (
      <>
        <TitleSection
          title="Cash-out"
          appendix={
            <HelpTooltip width={320}>
              <P>
                For details on configuring cash-out, please read the relevant
                knowledgebase article:
              </P>
              <SupportLinkButton
                link="https://support.lamassu.is/hc/en-us/articles/115003720192-Enabling-cash-out-on-the-admin"
                label="Enabling cash-out on the admin"
                bottomSpace="1"
              />
            </HelpTooltip>
          }>
          <div className={classes.fudgeFactor}>
            <P>Transaction fudge factor</P>
            <Switch
              checked={fudgeFactorActive}
              onChange={event => {
                save({ fudgeFactorActive: event.target.checked })
              }}
              value={fudgeFactorActive}
            />
            <Label2 className={classes.switchLabel}>
              {fudgeFactorActive ? 'On' : 'Off'}
            </Label2>
            <HelpTooltip width={304}>
              <P>
                Automatically accept customer deposits as complete if their
                received amount is 100 crypto atoms or less.
              </P>
              <P>
                (Crypto atoms are the smallest unit in each cryptocurrency.
                E.g., satoshis in Bitcoin, or wei in Ethereum.)
              </P>
              <P>For details please read the relevant knowledgebase article:</P>
              <SupportLinkButton
                link="https://support.lamassu.is/hc/en-us/articles/360050838011-Automatically-accepting-undersent-deposits-with-Fudge-Factor-"
                label="Lamassu Support Article"
                bottomSpace="1"
              />
            </HelpTooltip>
          </div>
        </TitleSection>
        <EditableTable
          namespaces={R.map(R.path(['deviceId']))(machines)}
          data={config}
          stripeWhen={wasNeverEnabled}
          enableEdit
          editWidth={95}
          enableToggle
          toggleWidth={100}
          onToggle={onToggle}
          save={save}
          error={error?.message}
          validationSchema={DenominationsSchema}
          disableRowEdit={R.compose(R.not, R.path(['active']))}
          elements={getElements(machines, locale, classes)}
        />
        {R.isEmpty(machines) && <EmptyTable message="No machines so far" />}
        {wizard && (
          <Wizard
            machine={R.find(R.propEq('deviceId', wizard))(machines)}
            onClose={() => setWizard(false)}
            save={save}
            error={error?.message}
            locale={locale}
          />
        )}
      </>
    )
  )
}

export default CashOut
