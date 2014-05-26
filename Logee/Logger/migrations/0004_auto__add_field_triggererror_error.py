# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding field 'TriggerError.error'
        db.add_column('Logger_triggererror', 'error',
                      self.gf('django.db.models.fields.TextField')(default=''),
                      keep_default=False)


    def backwards(self, orm):
        # Deleting field 'TriggerError.error'
        db.delete_column('Logger_triggererror', 'error')


    models = {
        'Logger.event': {
            'Meta': {'object_name': 'Event'},
            'date': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'info': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'involved_objects': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'events'", 'symmetrical': 'False', 'to': "orm['Logger.LogObject']"}),
            'namespace': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['Logger.Namespace']"}),
            'tag': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'trigger': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['Logger.Trigger']", 'null': 'True', 'blank': 'True'}),
            'type': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['Logger.EventType']"})
        },
        'Logger.eventtype': {
            'Meta': {'unique_together': "(('name', 'namespace'),)", 'object_name': 'EventType'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'namespace': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['Logger.Namespace']"})
        },
        'Logger.logobject': {
            'Meta': {'unique_together': "(('external_identifier', 'namespace'),)", 'object_name': 'LogObject'},
            'external_identifier': ('django.db.models.fields.CharField', [], {'max_length': '300'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'info': ('django.db.models.fields.CharField', [], {'max_length': '300', 'null': 'True', 'blank': 'True'}),
            'namespace': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['Logger.Namespace']"})
        },
        'Logger.namespace': {
            'Meta': {'object_name': 'Namespace'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'info': ('django.db.models.fields.CharField', [], {'max_length': '300', 'null': 'True', 'blank': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '100'})
        },
        'Logger.trigger': {
            'Meta': {'object_name': 'Trigger'},
            'evaluator': ('django.db.models.fields.TextField', [], {}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '300'}),
            'namespace': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['Logger.Namespace']"})
        },
        'Logger.triggererror': {
            'Meta': {'object_name': 'TriggerError'},
            'context': ('django.db.models.fields.TextField', [], {}),
            'date': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'error': ('django.db.models.fields.TextField', [], {}),
            'evaluator': ('django.db.models.fields.TextField', [], {}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'trigger': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['Logger.Trigger']"})
        }
    }

    complete_apps = ['Logger']