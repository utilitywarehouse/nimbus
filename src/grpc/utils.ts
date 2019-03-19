import * as grpc from 'grpc';
import { TransportError } from '../errors';
import { Call } from 'grpc';

export type gRPCHandler<T> = (error: grpc.ServiceError | null, response: T) => void;

export type PromisedGRPCResponse<T> = Promise<{
  response: T;
  call: Call;
}>;

/**
 * Promisify a grpc call
 * @param grpcClientCall
 */
export function promisify<T>(grpcClientCall: (callback: gRPCHandler<T>) => Call): PromisedGRPCResponse<T> {
  function handleGRPC(resolve: (data: T) => void, reject: (error: Error) => void): gRPCHandler<T> {
    return (error: grpc.ServiceError | null, response: T) => {
      if (error) {
        return reject(TransportError.wrap(error));
      }
      return resolve(response);
    };
  }

  return new Promise(async (enhancedResolve, enhancedReject) => {
    try {
      let call: Call;
      const response = await new Promise((resolve: (data: T) => void, reject) => {
        call = grpcClientCall(handleGRPC(resolve, reject));
      });

      enhancedResolve({
        response,
        call,
      });
    } catch (e) {
      enhancedReject(e);
    }
  });
}
