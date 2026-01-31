/**
 * Sensor Clients
 *
 * Factory functions for creating sensor data clients.
 * Supports MQTT (IoT) and OPC-UA (Industrial Automation) protocols.
 *
 * @module lib/monitor/sensors
 */

export {
  createMQTTClient,
  createMQTTSensorService,
  createSmartFactoryMQTTClient,
  mqttPayloadToSensorReading,
  DEFAULT_SENSOR_TOPICS,
  type MQTTClient,
  type MQTTClientOptions,
  type MQTTSensorPayload,
  type MQTTConnectionState,
  type MQTTSensorService,
  type MQTTSensorServiceOptions,
  type MessageHandler,
  type StateChangeHandler,
  type SensorReadingHandler,
} from './mqtt-client'

export {
  createOPCUAClient,
  createOPCUASensorService,
  createSmartFactoryOPCUAClient,
  parseNodeId,
  serializeNodeId,
  DEFAULT_OPCUA_NODES,
  type OPCUAClient,
  type OPCUAClientOptions,
  type OPCUAConnectionState,
  type OPCUASensorService,
  type OPCUASensorServiceOptions,
  type DataValue,
  type DataChangeHandler,
  type OPCUAStateChangeHandler,
  type NodeId,
  type SecurityMode,
  type SecurityPolicy,
  type BrowseResult,
} from './opc-ua-client'
