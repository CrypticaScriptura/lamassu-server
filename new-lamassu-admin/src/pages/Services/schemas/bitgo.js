import * as Yup from 'yup'

import {
  TextInput,
  SecretInput,
  Autocomplete
} from 'src/components/inputs/formik'

import { secretTest } from './helper'

const isDefined = it => it && it.length

const buildTestValidation = (id, passphrase) => {
  return Yup.string()
    .max(100, 'Too long')
    .when(id, {
      is: isDefined,
      then: schema => schema.test(secretTest(passphrase))
    })
}

export default {
  code: 'bitgo',
  name: 'BitGo',
  title: 'BitGo (Wallet)',
  elements: [
    {
      code: 'token',
      display: 'API token',
      component: TextInput,
      face: true,
      long: true
    },
    {
      code: 'environment',
      display: 'Environment',
      component: Autocomplete,
      inputProps: {
        options: [
          { code: 'prod', display: 'prod' },
          { code: 'test', display: 'test' }
        ],
        labelProp: 'display',
        valueProp: 'code'
      },
      face: true
    },
    {
      code: 'BTCWalletId',
      display: 'BTC wallet ID',
      component: TextInput
    },
    {
      code: 'BTCWalletPassphrase',
      display: 'BTC wallet passphrase',
      component: SecretInput
    },
    {
      code: 'LTCWalletId',
      display: 'LTC wallet ID',
      component: TextInput
    },
    {
      code: 'LTCWalletPassphrase',
      display: 'LTC wallet passphrase',
      component: SecretInput
    },
    {
      code: 'ZECWalletId',
      display: 'ZEC wallet ID',
      component: TextInput
    },
    {
      code: 'ZECWalletPassphrase',
      display: 'ZEC wallet passphrase',
      component: SecretInput
    },
    {
      code: 'BCHWalletId',
      display: 'BCH wallet ID',
      component: TextInput
    },
    {
      code: 'BCHWalletPassphrase',
      display: 'BCH wallet passphrase',
      component: SecretInput
    },
    {
      code: 'DASHWalletId',
      display: 'DASH wallet ID',
      component: TextInput
    },
    {
      code: 'DASHWalletPassphrase',
      display: 'DASH wallet passphrase',
      component: SecretInput
    }
  ],
  getValidationSchema: account => {
    return Yup.object().shape({
      token: Yup.string('The token must be a string')
        .max(100, 'The token is too long')
        .required('The token is required'),
      BTCWalletId: Yup.string('The BTC wallet ID must be a string').max(
        100,
        'The BTC wallet ID is too long'
      ),
      BTCWalletPassphrase: buildTestValidation(
        'BTCWalletId',
        account?.BTCWalletPassphrase
      ),
      LTCWalletId: Yup.string('The LTC wallet ID must be a string').max(
        100,
        'The LTC wallet ID is too long'
      ),
      LTCWalletPassphrase: buildTestValidation(
        'LTCWalletId',
        account?.LTCWalletPassphrase
      ),
      ZECWalletId: Yup.string('The ZEC wallet ID must be a string').max(
        100,
        'The ZEC wallet ID is too long'
      ),
      ZECWalletPassphrase: buildTestValidation(
        'ZECWalletId',
        account?.ZECWalletPassphrase
      ),
      BCHWalletId: Yup.string('The BCH wallet ID must be a string').max(
        100,
        'The BCH wallet ID is too long'
      ),
      BCHWalletPassphrase: buildTestValidation(
        'BCHWalletId',
        account?.BCHWalletPassphrase
      ),
      DASHWalletId: Yup.string('The DASH wallet ID must be a string').max(
        100,
        'The DASH wallet ID is too long'
      ),
      DASHWalletPassphrase: buildTestValidation(
        'DASHWalletId',
        account?.DASHWalletPassphrase
      ),
      environment: Yup.string('The environment must be a string')
        .matches(/(prod|test)/)
        .required('The environment is required')
    })
  }
}
