import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiService {
  static const String baseUrl = 'https://chalao.vercel.app/api';

  static final _storage = const FlutterSecureStorage();

  static Future<String?> getToken() async => await _storage.read(key: 'chalao_driver_token');
  static Future<void> saveToken(String token) async => await _storage.write(key: 'chalao_driver_token', value: token);
  static Future<void> clearToken() async => await _storage.delete(key: 'chalao_driver_token');

  static Future<Map<String, String>> _headers({bool auth = false}) async {
    final headers = <String, String>{'Content-Type': 'application/json', 'Accept': 'application/json'};
    if (auth) {
      final token = await getToken();
      if (token != null) headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  static Future<Map<String, dynamic>> sendOtp(String phone) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/send-otp'),
      headers: await _headers(),
      body: jsonEncode({'phone': phone, 'role': 'driver'}),
    );
    return _handleResponse(response);
  }

  static Future<Map<String, dynamic>> verifyOtp(String phone, String otp) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/verify-otp'),
      headers: await _headers(),
      body: jsonEncode({'phone': phone, 'otp': otp, 'role': 'driver'}),
    );
    return _handleResponse(response);
  }

  static Future<Map<String, dynamic>> getMe() async {
    final response = await http.get(Uri.parse('$baseUrl/auth/me'), headers: await _headers(auth: true));
    return _handleResponse(response);
  }

  static Future<Map<String, dynamic>> updateProfile({String? name}) async {
    final response = await http.patch(
      Uri.parse('$baseUrl/auth/me'),
      headers: await _headers(auth: true),
      body: jsonEncode({if (name != null) 'name': name}),
    );
    return _handleResponse(response);
  }

  static Future<Map<String, dynamic>> getKyc() async {
    final response = await http.get(Uri.parse('$baseUrl/driver/kyc'), headers: await _headers(auth: true));
    return _handleResponse(response);
  }

  static Future<Map<String, dynamic>> submitKyc(Map<String, dynamic> data) async {
    final response = await http.post(
      Uri.parse('$baseUrl/driver/kyc'),
      headers: await _headers(auth: true),
      body: jsonEncode(data),
    );
    return _handleResponse(response);
  }

  static Future<Map<String, dynamic>> updateLocation({
    required double latitude,
    required double longitude,
    double? heading,
    double? speed,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/driver/location'),
      headers: await _headers(auth: true),
      body: jsonEncode({'latitude': latitude, 'longitude': longitude, 'heading': heading, 'speed': speed}),
    );
    return _handleResponse(response);
  }

  static Future<Map<String, dynamic>> setOnlineStatus(bool isOnline) async {
    final response = await http.patch(
      Uri.parse('$baseUrl/driver/location'),
      headers: await _headers(auth: true),
      body: jsonEncode({'isOnline': isOnline}),
    );
    return _handleResponse(response);
  }

  static Future<Map<String, dynamic>> getEarnings({String period = 'today'}) async {
    final response = await http.get(
      Uri.parse('$baseUrl/driver/earnings?period=$period'),
      headers: await _headers(auth: true),
    );
    return _handleResponse(response);
  }

  static Future<Map<String, dynamic>> requestPayout(String upiId) async {
    final response = await http.post(
      Uri.parse('$baseUrl/driver/earnings'),
      headers: await _headers(auth: true),
      body: jsonEncode({'upiId': upiId}),
    );
    return _handleResponse(response);
  }

  static Future<Map<String, dynamic>> updateRide(int rideId, Map<String, dynamic> data) async {
    final response = await http.patch(
      Uri.parse('$baseUrl/rides/$rideId'),
      headers: await _headers(auth: true),
      body: jsonEncode(data),
    );
    return _handleResponse(response);
  }

  static Map<String, dynamic> _handleResponse(http.Response response) {
    final data = jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode >= 200 && response.statusCode < 300) return data;
    throw ApiException(statusCode: response.statusCode, message: data['error'] ?? 'Unknown error');
  }
}

class ApiException implements Exception {
  final int statusCode;
  final String message;
  ApiException({required this.statusCode, required this.message});
  @override
  String toString() => 'ApiException($statusCode): $message';
}
