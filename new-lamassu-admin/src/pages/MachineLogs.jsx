import { useQuery } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core/styles'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState } from 'react'
import LogsDowloaderPopover from 'src/components/LogsDownloaderPopper'
import Title from 'src/components/Title'
import Sidebar from 'src/components/layout/Sidebar'
import { Info3, H4 } from 'src/components/typography'

import {
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell
} from 'src/components/table'
import { formatDate } from 'src/utils/timezones'

import styles from './Logs.styles'

const useStyles = makeStyles(styles)

const GET_MACHINES = gql`
  {
    machines {
      name
      deviceId
    }
  }
`

const NUM_LOG_RESULTS = 500

const GET_MACHINE_LOGS_CSV = gql`
  query MachineLogs(
    $deviceId: ID!
    $limit: Int
    $from: Date
    $until: Date
    $timezone: String
  ) {
    machineLogsCsv(
      deviceId: $deviceId
      limit: $limit
      from: $from
      until: $until
      timezone: $timezone
    )
  }
`

const GET_MACHINE_LOGS = gql`
  query MachineLogs($deviceId: ID!, $limit: Int, $from: Date, $until: Date) {
    machineLogs(
      deviceId: $deviceId
      limit: $limit
      from: $from
      until: $until
    ) {
      logLevel
      id
      timestamp
      message
    }
  }
`

const GET_DATA = gql`
  query getData {
    config
  }
`

const Logs = () => {
  const classes = useStyles()

  const [selected, setSelected] = useState(null)
  const [saveMessage, setSaveMessage] = useState(null)

  const deviceId = selected?.deviceId

  const { data: machineResponse, loading: machinesLoading } =
    useQuery(GET_MACHINES)

  const { data: configResponse, loading: configLoading } = useQuery(GET_DATA)
  const timezone = R.path(['config', 'locale_timezone'], configResponse)

  const { data: logsResponse, loading: logsLoading } = useQuery(
    GET_MACHINE_LOGS,
    {
      variables: { deviceId, limit: NUM_LOG_RESULTS },
      skip: !selected,
      onCompleted: () => setSaveMessage('')
    }
  )

  if (machineResponse?.machines?.length && !selected) {
    setSelected(machineResponse?.machines[0])
  }

  const isSelected = it => {
    return R.path(['deviceId'])(selected) === it.deviceId
  }

  const loading = machinesLoading || configLoading || logsLoading

  return (
    <>
      <div className={classes.titleWrapper}>
        <div className={classes.titleAndButtonsContainer}>
          <Title>Machine logs</Title>
          {logsResponse && (
            <div className={classes.buttonsWrapper}>
              <LogsDowloaderPopover
                title="Download logs"
                name={selected.name}
                query={GET_MACHINE_LOGS_CSV}
                args={{ deviceId, timezone }}
                getLogs={logs => R.path(['machineLogsCsv'])(logs)}
                timezone={timezone}
              />
              <Info3>{saveMessage}</Info3>
            </div>
          )}
        </div>
      </div>
      <div className={classes.wrapper}>
        <Sidebar
          displayName={it => it.name}
          data={machineResponse?.machines || []}
          isSelected={isSelected}
          onClick={setSelected}
        />
        <div className={classes.tableWrapper}>
          <Table className={classes.table}>
            <TableHead>
              <TableRow header>
                <TableHeader className={classes.dateColumn}>Date</TableHeader>
                <TableHeader className={classes.levelColumn}>Level</TableHeader>
                <TableHeader className={classes.fillColumn} />
              </TableRow>
            </TableHead>
            <TableBody>
              {logsResponse &&
                logsResponse.machineLogs.map((log, idx) => (
                  <TableRow key={idx} size="sm">
                    <TableCell>
                      {timezone &&
                        formatDate(log.timestamp, timezone, 'yyyy-MM-dd HH:mm')}
                    </TableCell>
                    <TableCell>{log.logLevel}</TableCell>
                    <TableCell>{log.message}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          {loading && <H4>{'Loading...'}</H4>}
          {!loading && !logsResponse?.machineLogs?.length && (
            <H4>{'No activity so far'}</H4>
          )}
        </div>
      </div>
    </>
  )
}

export default Logs
