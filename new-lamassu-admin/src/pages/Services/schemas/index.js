import _binance from './binance'
import _binanceus from './binanceus'
import bitgo from './bitgo'
import _bitstamp from './bitstamp'
import blockcypher from './blockcypher'
import _cex from './cex'
import ciphertrace from './ciphertrace'
import galoy from './galoy'
import infura from './infura'
import _itbit from './itbit'
import _kraken from './kraken'
import mailgun from './mailgun'
import twilio from './twilio'

const schemas = (markets = {}) => {
  const binance = _binance(markets?.binance)
  const binanceus = _binanceus(markets?.binanceus)
  const bitstamp = _bitstamp(markets?.bitstamp)
  const cex = _cex(markets?.cex)
  const itbit = _itbit(markets?.itbit)
  const kraken = _kraken(markets?.kraken)

  return {
    [bitgo.code]: bitgo,
    [bitstamp.code]: bitstamp,
    [blockcypher.code]: blockcypher,
    [infura.code]: infura,
    [itbit.code]: itbit,
    [kraken.code]: kraken,
    [mailgun.code]: mailgun,
    [twilio.code]: twilio,
    [binanceus.code]: binanceus,
    [cex.code]: cex,
    [ciphertrace.code]: ciphertrace,
    [binance.code]: binance,
    [galoy.code]: galoy
  }
}

export default schemas
