import { BaseError } from './base';
import { GraphQLError } from 'graphql';

export class GQLError extends BaseError {

  constructor(message: string, readonly type: string, readonly gql: GraphQLError, readonly previous?: BaseError | Error) {
    super(message);
  }

  static from(error: GraphQLError): GQLError {

    let err: GQLError;

    if (error.originalError instanceof BaseError) {
      err = new GQLError(error.originalError.message, error.originalError.constructor.name, error, error.originalError.previous);
    } else if (error.originalError && Object.keys(error.originalError).length > 0) {
      err = new GQLError(error.originalError.message, error.originalError.constructor.name, error);
    } else {
      err = new GQLError(error.message, error.constructor.name, error);
    }

    if (error.extensions && error.extensions.correlationId) {
      err.setCorrelationId(error.extensions.correlationId);
    }

    return err;
  }

  render(): any {
    const details = super.render();
    details.type = this.type;
    details.locations = this.gql.locations;
    details.path = this.gql.path;
    details.extensions = this.gql.extensions;

    if (details.extensions) {
      details.extensions.exception = details.extensions.exception || {};
      details.extensions.exception.type = this.type;
      details.extensions.exception.message = this.message;

      if (this.previous && this.previous instanceof BaseError) {
        details.extensions.exception.previous = this.previous.render();
      } else if (this.previous && this.previous.message) {
        details.extensions.exception.previous = this.previous.message;
      }
    }
    return details;
  }
}
