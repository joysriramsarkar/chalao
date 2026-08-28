class UserModel {
  final int id;
  final String phone;
  final String? name;
  final String role;
  final String? avatarUrl;
  final String? emergencyContact;
  final String? emergencyName;
  final DateTime createdAt;

  const UserModel({
    required this.id,
    required this.phone,
    this.name,
    required this.role,
    this.avatarUrl,
    this.emergencyContact,
    this.emergencyName,
    required this.createdAt,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as int,
      phone: json['phone'] as String,
      name: json['name'] as String?,
      role: json['role'] as String? ?? 'rider',
      avatarUrl: json['avatarUrl'] as String?,
      emergencyContact: json['emergencyContact'] as String?,
      emergencyName: json['emergencyName'] as String?,
      createdAt: DateTime.tryParse(json['createdAt'] as String? ?? '') ?? DateTime.now(),
    );
  }

  bool get hasProfile => name != null && name!.isNotEmpty;
}

class RideModel {
  final int id;
  final String status;
  final String vehicleType;
  final String pickupAddress;
  final String dropoffAddress;
  final double? estimatedFare;
  final double? finalFare;
  final double? distanceKm;
  final String? paymentMethod;
  final String? riderOtpPin;
  final String? driverName;
  final String? driverPhone;
  final double? driverLat;
  final double? driverLng;
  final double? driverRating;
  final DateTime createdAt;

  const RideModel({
    required this.id,
    required this.status,
    required this.vehicleType,
    required this.pickupAddress,
    required this.dropoffAddress,
    this.estimatedFare,
    this.finalFare,
    this.distanceKm,
    this.paymentMethod,
    this.riderOtpPin,
    this.driverName,
    this.driverPhone,
    this.driverLat,
    this.driverLng,
    this.driverRating,
    required this.createdAt,
  });

  factory RideModel.fromJson(Map<String, dynamic> json) {
    return RideModel(
      id: json['id'] as int,
      status: json['status'] as String,
      vehicleType: json['vehicle_type'] as String? ?? 'sedan',
      pickupAddress: json['pickup_address'] as String? ?? '',
      dropoffAddress: json['dropoff_address'] as String? ?? '',
      estimatedFare: (json['estimated_fare'] as num?)?.toDouble(),
      finalFare: (json['final_fare'] as num?)?.toDouble(),
      distanceKm: (json['distance_km'] as num?)?.toDouble(),
      paymentMethod: json['payment_method'] as String?,
      riderOtpPin: json['rider_otp_pin'] as String?,
      driverName: json['driver_name'] as String?,
      driverPhone: json['driver_phone'] as String?,
      driverLat: (json['driver_lat'] as num?)?.toDouble(),
      driverLng: (json['driver_lng'] as num?)?.toDouble(),
      driverRating: (json['driver_rating'] as num?)?.toDouble(),
      createdAt: DateTime.tryParse(json['created_at'] as String? ?? '') ?? DateTime.now(),
    );
  }
}
