import Foundation

/// Minimal runtime support required by OpenAPI Generator's model-only Swift output.
/// The generated models remain the source of truth; this file is intentionally small
/// so the SDK does not depend on the generator's transport runtime.
public protocol JSONEncodable: Encodable {}

public struct StringRule: Hashable, Sendable {
    public let minLength: Int?
    public let maxLength: Int?
    public let pattern: String?

    public init(minLength: Int?, maxLength: Int?, pattern: String?) {
        self.minLength = minLength
        self.maxLength = maxLength
        self.pattern = pattern
    }
}

public struct NumericRule<Value: Comparable & Codable & Hashable>: Hashable, Sendable where Value: Sendable {
    public let minimum: Value?
    public let exclusiveMinimum: Bool
    public let maximum: Value?
    public let exclusiveMaximum: Bool
    public let multipleOf: Value?

    public init(minimum: Value?, exclusiveMinimum: Bool, maximum: Value?, exclusiveMaximum: Bool, multipleOf: Value?) {
        self.minimum = minimum
        self.exclusiveMinimum = exclusiveMinimum
        self.maximum = maximum
        self.exclusiveMaximum = exclusiveMaximum
        self.multipleOf = multipleOf
    }
}

public enum AnyCodable: Codable, Hashable, Sendable {
    case null
    case bool(Bool)
    case number(Double)
    case string(String)
    case array([AnyCodable])
    case object([String: AnyCodable])

    public init(from decoder: Decoder) throws {
        let value = try decoder.singleValueContainer()
        if value.decodeNil() { self = .null }
        else if let bool = try? value.decode(Bool.self) { self = .bool(bool) }
        else if let number = try? value.decode(Double.self) { self = .number(number) }
        else if let string = try? value.decode(String.self) { self = .string(string) }
        else if let array = try? value.decode([AnyCodable].self) { self = .array(array) }
        else { self = .object(try value.decode([String: AnyCodable].self)) }
    }

    public func encode(to encoder: Encoder) throws {
        var value = encoder.singleValueContainer()
        switch self {
        case .null: try value.encodeNil()
        case .bool(let item): try value.encode(item)
        case .number(let item): try value.encode(item)
        case .string(let item): try value.encode(item)
        case .array(let item): try value.encode(item)
        case .object(let item): try value.encode(item)
        }
    }
}
