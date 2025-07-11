import { expect } from 'chai';
import { spec } from 'modules/bidglassBidAdapter.js';
import { newBidder } from 'src/adapters/bidderFactory.js';

describe('Bid Glass Adapter', function () {
  const adapter = newBidder(spec);

  describe('isBidRequestValid', function () {
    const bid = {
      'bidder': 'bidglass',
      'params': {
        'adUnitId': '3'
      },
      'adUnitCode': 'bidglass-testunit',
      'sizes': [[300, 250], [300, 600]],
      'bidId': '30b31c1838de1e',
      'bidderRequestId': '22edbae2733bf6',
      'auctionId': '1d1a030790a475',
    };

    it('should return true when required params found', function () {
      expect(spec.isBidRequestValid(bid)).to.equal(true);
    });

    it('should return false when required params are not passed', function () {
      const invalidBid = Object.assign({}, bid);
      delete invalidBid.params;
      invalidBid.params = {};
      expect(spec.isBidRequestValid(invalidBid)).to.equal(false);
    });
  });

  describe('buildRequests', function () {
    const bidRequests = [{
      'bidder': 'bidglass',
      'params': {
        'adUnitId': '3'
      },
      'adUnitCode': 'bidglass-testunit',
      'sizes': [[300, 250], [300, 600]],
      'bidId': '30b31c1838de1e',
      'bidderRequestId': '22edbae2733bf6',
      'auctionId': '1d1a030790a475',
    }];

    const request = spec.buildRequests(bidRequests);

    it('sends bid request to our endpoint via POST', function () {
      expect(request.method).to.equal('POST');
    });

    it('sets withCredentials to false', function () {
      expect(request.options.withCredentials).to.equal(false);
    });
  });

  describe('interpretResponse', function () {
    let serverRequest, serverResponse;
    beforeEach(function () {
      serverRequest = {
        data: JSON.stringify({
          'reqId': '30b31c1838de1e',
          'gdprApplies': '1',
          'gdprConsent': 'BOJObISOJObISAABAAENAA4AAAAAo',
          'gppString': 'DBABMA~CPXxRfAPXxRfAAfKABENB-CgAAAAAAAAAAYgAAAAAAAA',
          'gppSid': '7,8',
        })
      };
      serverResponse = {
        body: {
          'bidResponses': [{
            'ad': '<script src="https://bid.glass/hb-unit/999999.js?t=tokenstring&replaceme" async></script>',
            'cpm': '0.01',
            'creativeId': '-1',
            'width': '300',
            'height': '250',
            'requestId': '30b31c1838de1e',
            'meta': {
              'advertiserDomains': ['https://example.com']
            }
          }]
        }
      };
    });

    it('should get the correct bid response', function () {
      const expectedResponse = [{
        'requestId': '30b31c1838de1e',
        'cpm': 0.01,
        'width': 300,
        'height': 250,
        'creativeId': '-1',
        'dealId': null,
        'currency': 'USD',
        'mediaType': 'banner',
        'netRevenue': true,
        'ttl': 10,
        'ad': '<script src="https://bid.glass/hb-unit/999999.js?t=tokenstring&gdprApplies=1&gdprConsent=BOJObISOJObISAABAAENAA4AAAAAo&gppString=DBABMA~CPXxRfAPXxRfAAfKABENB-CgAAAAAAAAAAYgAAAAAAAA&gppSid=7%2C8" async></script>',
        'meta': {
          'advertiserDomains': ['https://example.com']
        }
      }];

      const result = spec.interpretResponse(serverResponse, serverRequest);
      expect(result[0]).to.deep.equal(expectedResponse[0]);
    });

    it('handles empty bid response', function () {
      const response = {
        body: {
          'bidResponses': []
        }
      };
      const result = spec.interpretResponse(response, serverRequest);
      expect(result.length).to.equal(0);
    });
  });
});
