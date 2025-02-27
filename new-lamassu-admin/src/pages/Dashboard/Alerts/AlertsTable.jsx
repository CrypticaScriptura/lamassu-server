import { makeStyles } from '@material-ui/core'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import * as R from 'ramda'
import React from 'react'
import { useHistory } from 'react-router-dom'
import { P } from 'src/components/typography/index'
import Wrench from 'src/styling/icons/action/wrench/zodiac.svg?react'
import CashBoxEmpty from 'src/styling/icons/cassettes/cashbox-empty.svg?react'
import AlertLinkIcon from 'src/styling/icons/month arrows/right.svg?react'
import WarningIcon from 'src/styling/icons/warning-icon/tomato.svg?react'

import styles from './Alerts.styles'
const useStyles = makeStyles(styles)

const icons = {
  error: <WarningIcon style={{ height: 20, width: 20, marginRight: 12 }} />,
  fiatBalance: (
    <CashBoxEmpty style={{ height: 18, width: 18, marginRight: 14 }} />
  )
}

const links = {
  error: '/maintenance/machine-status',
  fiatBalance: '/maintenance/cash-cassettes',
  cryptoBalance: '/maintenance/funding'
}

const AlertsTable = ({ numToRender, alerts, machines }) => {
  const history = useHistory()
  const classes = useStyles()
  const alertsToRender = R.slice(0, numToRender, alerts)

  const alertMessage = alert => {
    const deviceId = alert.detail.deviceId
    if (!deviceId) return `${alert.message}`

    const deviceName = R.defaultTo('Unpaired device', machines[deviceId])
    return `${alert.message} - ${deviceName}`
  }

  return (
    <List dense className={classes.table}>
      {alertsToRender.map((alert, idx) => {
        return (
          <ListItem key={idx}>
            {icons[alert.type] || (
              <Wrench style={{ height: 23, width: 23, marginRight: 8 }} />
            )}
            <P className={classes.listItemText}>{alertMessage(alert)}</P>
            <AlertLinkIcon
              className={classes.linkIcon}
              onClick={() => history.push(links[alert.type] || '/dashboard')}
            />
          </ListItem>
        )
      })}
    </List>
  )
}

export default AlertsTable
