import { useQuery, useMutation } from '@apollo/react-hooks'
import { makeStyles, Breadcrumbs, Box } from '@material-ui/core'
import NavigateNextIcon from '@material-ui/icons/NavigateNext'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { memo, useState } from 'react'
import { useHistory, useParams } from 'react-router-dom'

import { ActionButton } from 'src/components/buttons'
import { Label1, Label2 } from 'src/components/typography'
import {
  OVERRIDE_AUTHORIZED,
  OVERRIDE_REJECTED
} from 'src/pages/Customers/components/propertyCard'
import { ReactComponent as AuthorizeReversedIcon } from 'src/styling/icons/button/authorize/white.svg'
import { ReactComponent as AuthorizeIcon } from 'src/styling/icons/button/authorize/zodiac.svg'
import { ReactComponent as BlockReversedIcon } from 'src/styling/icons/button/block/white.svg'
import { ReactComponent as BlockIcon } from 'src/styling/icons/button/block/zodiac.svg'
import { ReactComponent as DataReversedIcon } from 'src/styling/icons/button/data/white.svg'
import { ReactComponent as DataIcon } from 'src/styling/icons/button/data/zodiac.svg'
import { ReactComponent as DiscountReversedIcon } from 'src/styling/icons/button/discount/white.svg'
import { ReactComponent as Discount } from 'src/styling/icons/button/discount/zodiac.svg'
import { fromNamespace, namespaces } from 'src/utils/config'

import CustomerData from './CustomerData'
import styles from './CustomerProfile.styles'
import {
  CustomerDetails,
  TransactionsList,
  CustomerSidebar,
  Wizard
} from './components'
import { getFormattedPhone, getName } from './helper'

const useStyles = makeStyles(styles)

const GET_CUSTOMER = gql`
  query customer($customerId: ID!) {
    config
    customer(customerId: $customerId) {
      id
      authorizedOverride
      frontCameraPath
      frontCameraAt
      frontCameraOverride
      phone
      isAnonymous
      smsOverride
      idCardData
      idCardDataOverride
      idCardDataExpiration
      idCardPhotoPath
      idCardPhotoOverride
      usSsn
      usSsnOverride
      sanctions
      sanctionsAt
      sanctionsOverride
      totalTxs
      totalSpent
      lastActive
      lastTxFiat
      lastTxFiatCode
      lastTxClass
      daysSuspended
      isSuspended
      customFields {
        id
        label
        value
      }
      transactions {
        txClass
        id
        fiat
        fiatCode
        cryptoAtoms
        cryptoCode
        created
        machineName
        errorMessage: error
        error: errorCode
        txCustomerPhotoAt
        txCustomerPhotoPath
      }
      customInfoRequests {
        customerId
        approved
        customerData
        customInfoRequest {
          id
          enabled
          customRequest
        }
      }
    }
  }
`

const SET_CUSTOMER = gql`
  mutation setCustomer($customerId: ID!, $customerInput: CustomerInput) {
    setCustomer(customerId: $customerId, customerInput: $customerInput) {
      id
      authorizedOverride
      frontCameraPath
      frontCameraOverride
      phone
      smsOverride
      idCardData
      idCardDataOverride
      idCardDataExpiration
      idCardPhotoPath
      idCardPhotoOverride
      usSsn
      usSsnOverride
      sanctions
      sanctionsAt
      sanctionsOverride
      totalTxs
      totalSpent
      lastActive
      lastTxFiat
      lastTxFiatCode
      lastTxClass
      subscriberInfo
    }
  }
`
const EDIT_CUSTOMER = gql`
  mutation editCustomer($customerId: ID!, $customerEdit: CustomerEdit) {
    editCustomer(customerId: $customerId, customerEdit: $customerEdit) {
      id
      idCardData
      usSsn
    }
  }
`

const REPLACE_CUSTOMER_PHOTO = gql`
  mutation replacePhoto(
    $customerId: ID!
    $photoType: String
    $newPhoto: Upload
  ) {
    replacePhoto(
      customerId: $customerId
      photoType: $photoType
      newPhoto: $newPhoto
    ) {
      id
      newPhoto
      photoType
    }
  }
`

const DELETE_EDITED_CUSTOMER = gql`
  mutation deleteEditedData($customerId: ID!, $customerEdit: CustomerEdit) {
    deleteEditedData(customerId: $customerId, customerEdit: $customerEdit) {
      id
      frontCameraPath
      idCardData
      idCardPhotoPath
      usSsn
    }
  }
`

const SET_AUTHORIZED_REQUEST = gql`
  mutation setAuthorizedCustomRequest(
    $customerId: ID!
    $infoRequestId: ID!
    $isAuthorized: Boolean!
  ) {
    setAuthorizedCustomRequest(
      customerId: $customerId
      infoRequestId: $infoRequestId
      isAuthorized: $isAuthorized
    )
  }
`

const CustomerProfile = memo(() => {
  const history = useHistory()

  const [showCompliance, setShowCompliance] = useState(false)
  const [wizard, setWizard] = useState(false)
  const [error] = useState(null)
  const [clickedItem, setClickedItem] = useState('overview')
  const { id: customerId } = useParams()

  const { data: customerResponse, refetch: getCustomer, loading } = useQuery(
    GET_CUSTOMER,
    {
      variables: { customerId }
    }
  )

  const [replaceCustomerPhoto] = useMutation(REPLACE_CUSTOMER_PHOTO, {
    onCompleted: () => getCustomer()
  })

  const [editCustomerData] = useMutation(EDIT_CUSTOMER, {
    onCompleted: () => getCustomer()
  })

  const [deleteCustomerEditedData] = useMutation(DELETE_EDITED_CUSTOMER, {
    onCompleted: () => getCustomer()
  })

  const [setCustomer] = useMutation(SET_CUSTOMER, {
    onCompleted: () => getCustomer()
  })
  const [updateCustomRequest] = useMutation(SET_AUTHORIZED_REQUEST, {
    onCompleted: () => getCustomer()
  })

  const updateCustomer = it =>
    setCustomer({
      variables: {
        customerId,
        customerInput: it
      }
    })

  const replacePhoto = it =>
    replaceCustomerPhoto({
      variables: {
        customerId,
        newPhoto: it.newPhoto,
        photoType: it.photoType
      }
    })

  const editCustomer = it =>
    editCustomerData({
      variables: {
        customerId,
        customerEdit: it
      }
    })

  const deleteEditedData = it =>
    deleteCustomerEditedData({
      variables: {
        customerId,
        customerEdit: it
      }
    })

  const onClickSidebarItem = code => setClickedItem(code)

  const configData = R.path(['config'])(customerResponse) ?? []
  const locale = configData && fromNamespace(namespaces.LOCALE, configData)
  const customerData = R.path(['customer'])(customerResponse) ?? []
  const rawTransactions = R.path(['transactions'])(customerData) ?? []
  const sortedTransactions = R.sort(R.descend(R.prop('cryptoAtoms')))(
    rawTransactions
  )
  const name = getName(customerData)
  const blocked =
    R.path(['authorizedOverride'])(customerData) === OVERRIDE_REJECTED

  const isSuspended = customerData.isSuspended
  const isCustomerData = clickedItem === 'customerData'
  const isOverview = clickedItem === 'overview'

  const classes = useStyles({ blocked })

  return (
    <>
      <Breadcrumbs
        classes={{ root: classes.breadcrumbs }}
        separator={<NavigateNextIcon fontSize="small" />}
        aria-label="breadcrumb">
        <Label1
          noMargin
          className={classes.labelLink}
          onClick={() => history.push('/compliance/customers')}>
          Customers
        </Label1>
        <Label2 noMargin className={classes.labelLink}>
          {name.length
            ? name
            : getFormattedPhone(
                R.path(['phone'])(customerData),
                locale.country
              )}
        </Label2>
      </Breadcrumbs>
      <div className={classes.panels}>
        <div className={classes.leftSidePanel}>
          {!loading && !customerData.isAnonymous && (
            <div>
              <div>
                <CustomerSidebar
                  isSelected={code => code === clickedItem}
                  onClick={onClickSidebarItem}
                />
              </div>
              <Label1 className={classes.actionLabel}>Actions</Label1>
              <div>
                <ActionButton
                  className={classes.customerManualDataEntry}
                  color="primary"
                  Icon={DataIcon}
                  InverseIcon={DataReversedIcon}
                  onClick={() => setWizard(true)}>
                  {`Manual data entry`}
                </ActionButton>
              </div>
              <div>
                <ActionButton
                  className={classes.customerDiscount}
                  color="primary"
                  Icon={Discount}
                  InverseIcon={DiscountReversedIcon}
                  onClick={() => {}}>
                  {`Add individual discount`}
                </ActionButton>
              </div>
              <div>
                {isSuspended && (
                  <ActionButton
                    color="primary"
                    Icon={AuthorizeIcon}
                    InverseIcon={AuthorizeReversedIcon}
                    onClick={() =>
                      updateCustomer({
                        suspendedUntil: null
                      })
                    }>
                    {`Unsuspend customer`}
                  </ActionButton>
                )}
                <ActionButton
                  color="primary"
                  className={classes.customerBlock}
                  Icon={blocked ? AuthorizeIcon : BlockIcon}
                  InverseIcon={
                    blocked ? AuthorizeReversedIcon : BlockReversedIcon
                  }
                  onClick={() =>
                    updateCustomer({
                      authorizedOverride: blocked
                        ? OVERRIDE_AUTHORIZED
                        : OVERRIDE_REJECTED
                    })
                  }>
                  {`${blocked ? 'Authorize' : 'Block'} customer`}
                </ActionButton>
                <ActionButton
                  color="primary"
                  className={classes.retrieveInformation}
                  Icon={blocked ? AuthorizeIcon : BlockIcon}
                  InverseIcon={
                    blocked ? AuthorizeReversedIcon : BlockReversedIcon
                  }
                  onClick={() =>
                    setCustomer({
                      variables: {
                        customerId,
                        customerInput: {
                          subscriberInfo: true
                        }
                      }
                    })
                  }>
                  {`Retrieve information`}
                </ActionButton>
              </div>
            </div>
          )}
        </div>
        <div className={classes.rightSidePanel}>
          {isOverview && (
            <div>
              <Box
                className={classes.customerDetails}
                display="flex"
                justifyContent="space-between">
                <CustomerDetails
                  customer={customerData}
                  locale={locale}
                  setShowCompliance={() => setShowCompliance(!showCompliance)}
                />
              </Box>
              <div>
                <TransactionsList
                  customer={customerData}
                  data={sortedTransactions}
                  locale={locale}
                  loading={loading}
                />
              </div>
            </div>
          )}
          {isCustomerData && (
            <div>
              <CustomerData
                customer={customerData}
                updateCustomer={updateCustomer}
                replacePhoto={replacePhoto}
                editCustomer={editCustomer}
                deleteEditedData={deleteEditedData}
                updateCustomRequest={updateCustomRequest}></CustomerData>
            </div>
          )}
        </div>
        {wizard && (
          <Wizard
            error={error?.message}
            save={() => {}}
            onClose={() => setWizard(null)}
          />
        )}
      </div>
    </>
  )
})

export default CustomerProfile
