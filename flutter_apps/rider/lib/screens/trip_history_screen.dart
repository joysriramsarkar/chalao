import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'package:intl/intl.dart';

class TripHistoryScreen extends StatefulWidget {
  const TripHistoryScreen({super.key});

  @override
  State<TripHistoryScreen> createState() => _TripHistoryScreenState();
}

class _TripHistoryScreenState extends State<TripHistoryScreen> {
  List<Map<String, dynamic>> _rides = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadRides();
  }

  Future<void> _loadRides() async {
    try {
      final result = await ApiService.getRides();
      setState(() {
        _rides = List<Map<String, dynamic>>.from(result['rides'] as List);
        _isLoading = false;
      });
    } catch (e) {
      setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  String _vehicleIcon(String type) {
    const icons = {'bike': '🏍️', 'auto': '🛺', 'sedan': '🚗', 'suv': '🚙', 'ev': '⚡', 'pink': '🌸'};
    return icons[type] ?? '🚗';
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'completed': return const Color(0xFF10B981);
      case 'cancelled': return Colors.red;
      case 'ongoing': return const Color(0xFF6C3DF4);
      default: return Colors.orange;
    }
  }

  String _statusLabel(String status) {
    const labels = {'completed': 'সম্পন্ন', 'cancelled': 'বাতিল', 'ongoing': 'চলছে', 'searching': 'খোঁজা হচ্ছে'};
    return labels[status] ?? status;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('যাত্রার ইতিহাস')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text('লোড ব্যর্থ', style: TextStyle(color: Colors.grey[600])))
              : _rides.isEmpty
                  ? Center(
                      child: Column(mainAxisSize: MainAxisSize.min, children: [
                        const Text('🚗', style: TextStyle(fontSize: 56)),
                        const SizedBox(height: 16),
                        const Text('এখনো কোনো যাত্রা নেই', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500)),
                        const SizedBox(height: 8),
                        Text('প্রথম রাইড বুক করুন!', style: TextStyle(color: Colors.grey[600])),
                      ]),
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.all(16),
                      itemCount: _rides.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                      itemBuilder: (ctx, i) {
                        final r = _rides[i];
                        final status = r['status'] as String;
                        final fare = r['final_fare'] ?? r['estimated_fare'];
                        final createdAt = DateTime.tryParse(r['created_at'] as String? ?? '');
                        
                        return Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: const Color(0xFFE2E0FF)),
                            boxShadow: [
                              BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8),
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Text(_vehicleIcon(r['vehicle_type'] as String? ?? 'sedan'),
                                    style: const TextStyle(fontSize: 24)),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                      Text(
                                        createdAt != null
                                            ? DateFormat('d MMM, h:mm a').format(createdAt)
                                            : '',
                                        style: TextStyle(color: Colors.grey[500], fontSize: 12),
                                      ),
                                      Text(r['pickup_address'] as String? ?? '',
                                        style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13),
                                        overflow: TextOverflow.ellipsis),
                                    ]),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: _statusColor(status).withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(20),
                                    ),
                                    child: Text(_statusLabel(status),
                                      style: TextStyle(color: _statusColor(status), fontSize: 12, fontWeight: FontWeight.w600)),
                                  ),
                                ],
                              ),
                              if (r['dropoff_address'] != null) ...[
                                const SizedBox(height: 8),
                                Row(children: [
                                  const Icon(Icons.location_on, color: Colors.red, size: 14),
                                  const SizedBox(width: 6),
                                  Expanded(child: Text(r['dropoff_address'] as String,
                                    style: TextStyle(color: Colors.grey[600], fontSize: 12), overflow: TextOverflow.ellipsis)),
                                  if (fare != null)
                                    Text('₹$fare', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF6C3DF4))),
                                ]),
                              ],
                            ],
                          ),
                        );
                      },
                    ),
    );
  }
}
