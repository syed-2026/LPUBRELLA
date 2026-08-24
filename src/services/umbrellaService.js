const umbrellaRepository = require('../repositories/umbrellaRepository');
const AppError = require('../utils/AppError');

const umbrellaService = {
  // Validates an umbrella QR scan for the RENTAL flow. Never trusts the
  // client's belief about availability - always re-checks against the DB.
  async validateForRental(qrIdentifier) {
    const umbrella = await umbrellaRepository.findByQrIdentifier(qrIdentifier);
    if (!umbrella) {
      throw AppError.notFound('Umbrella not found', 'UMBRELLA_NOT_FOUND');
    }

    if (umbrella.status !== 'AVAILABLE') {
      throw AppError.conflict(
        `Umbrella is not available (current status: ${umbrella.status})`,
        'UMBRELLA_NOT_AVAILABLE'
      );
    }

    if (!umbrella.currentStation || umbrella.currentStation.status !== 'ACTIVE') {
      throw AppError.conflict('Umbrella station is not currently active', 'STATION_NOT_ACTIVE');
    }

    return umbrella;
  },
};

module.exports = umbrellaService;
