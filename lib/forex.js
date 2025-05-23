const _ = require('lodash/fp')
const axios = require('axios')
const mem = require('mem')

const BN = require('./bn')
const T = require('./time')

const MAX_ROTATIONS = 5

const _getFiatRates = () => (
  axios.get('https://bitpay.com/api/rates')
    .then(response => response.data)
)

const getFiatRates = mem(_getFiatRates, {
  maxAge: 6 * T.hours,
  cacheKey: () => ''
})

const API_QUEUE = [
  { api: getBitPayFxRate, name: 'bitpay', fiatCodeProperty: 'code', rateProperty: 'rate' }
]

function getBitPayFxRate (fiatCode, defaultFiatMarket, fiatCodeProperty, rateProperty) {
  return getFiatRates()
    .then(fxRates => {
      const defaultFiatRate = findCurrencyRates(fxRates, defaultFiatMarket, fiatCodeProperty, rateProperty)
      const fxRate = findCurrencyRates(fxRates, fiatCode, fiatCodeProperty, rateProperty).div(defaultFiatRate)
      return {
        fxRate
      }
    })
}

function findCurrencyRates (fxRates, fiatCode, fiatCodeProperty, rateProperty) {
  const rates = _.find(_.matchesProperty(fiatCodeProperty, fiatCode), fxRates)
  if (!rates || !rates[rateProperty]) throw new Error(`Unsupported currency: ${fiatCode}`)
  return new BN(rates[rateProperty].toString())
}

const getRate = (retries = 1, fiatCode, defaultFiatMarket) => {
  const selected = _.first(API_QUEUE).name
  const activeAPI = _.first(API_QUEUE).api
  const fiatCodeProperty = _.first(API_QUEUE).fiatCodeProperty
  const rateProperty = _.first(API_QUEUE).rateProperty

  if (!activeAPI) throw new Error(`FOREX api ${selected} does not exist.`)

  return activeAPI(fiatCode, defaultFiatMarket, fiatCodeProperty, rateProperty)
    .catch(err => {
      // Switch service
      const erroredService = API_QUEUE.shift()
      API_QUEUE.push(erroredService)
      if (retries >= MAX_ROTATIONS) throw new Error(`FOREX API error from ${erroredService.name} ${err?.message}`)

      return getRate(++retries, fiatCode, defaultFiatMarket)
    })
}

module.exports = { getFiatRates, getRate }
