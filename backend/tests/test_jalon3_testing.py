"""Integration : python -m unittest discover -s backend/tests -v"""
import unittest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from backend.jalon3_testing import router


class Jalon3TestingTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        app = FastAPI()
        app.include_router(router)
        cls.client = TestClient(app)

    def testProductionWithGroundTruth(self):
        response = self.client.post('/api/jalon3/production', json={'index': 12})
        self.assertEqual(response.status_code, 200, response.text)
        result = response.json()
        self.assertEqual(len(result['actualMW']), 6)
        self.assertTrue(all(0 <= value <= 20 for value in result['fineTunedMW']))
        self.assertIsNotNone(result['maeFineTunedMW'])
        self.assertEqual(self.client.post('/api/jalon3/production', json={'index': 999999}).status_code, 422)

    def testSkyImportHasNoInventedGroundTruth(self):
        for site in ['A', 'B']:
            response = self.client.post('/api/jalon3/sky', json={'site': site})
            self.assertEqual(response.status_code, 200, response.text)
            result = response.json()
            self.assertIsNotNone(result['truth'])
            self.assertEqual(result['prediction']['coverage'] is None, site == 'A')
            imported = self.client.post('/api/jalon3/sky', json={'site': site, 'image_base64': result['image']})
            self.assertEqual(imported.status_code, 200, imported.text)
            self.assertIsNone(imported.json()['truth'])
            self.assertIsNone(imported.json()['absoluteError'])

    def testInvalidImageAndSiteAreRejected(self):
        self.assertEqual(self.client.post('/api/jalon3/sky', json={'image_base64': 'invalid!'}).status_code, 422)
        self.assertEqual(self.client.post('/api/jalon3/sky', json={'site': 'C'}).status_code, 422)
