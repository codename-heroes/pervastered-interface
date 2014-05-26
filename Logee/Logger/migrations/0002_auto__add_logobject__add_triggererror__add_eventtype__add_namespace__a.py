# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'LogObject'
        db.create_table('Logger_logobject', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('external_identifier', self.gf('django.db.models.fields.CharField')(max_length=300)),
            ('info', self.gf('django.db.models.fields.CharField')(max_length=300, null=True, blank=True)),
            ('namespace', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['Logger.Namespace'])),
        ))
        db.send_create_signal('Logger', ['LogObject'])

        # Adding model 'TriggerError'
        db.create_table('Logger_triggererror', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('trigger', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['Logger.Trigger'])),
            ('context', self.gf('django.db.models.fields.TextField')()),
            ('evaluator', self.gf('django.db.models.fields.TextField')()),
            ('date', self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, blank=True)),
        ))
        db.send_create_signal('Logger', ['TriggerError'])

        # Adding model 'EventType'
        db.create_table('Logger_eventtype', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('namespace', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['Logger.Namespace'])),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=100)),
        ))
        db.send_create_signal('Logger', ['EventType'])

        # Adding model 'Namespace'
        db.create_table('Logger_namespace', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(unique=True, max_length=100)),
            ('info', self.gf('django.db.models.fields.CharField')(max_length=300, null=True, blank=True)),
        ))
        db.send_create_signal('Logger', ['Namespace'])

        # Adding model 'Event'
        db.create_table('Logger_event', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('date', self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, blank=True)),
            ('info', self.gf('django.db.models.fields.TextField')(blank=True)),
            ('type', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['Logger.EventType'])),
            ('tag', self.gf('django.db.models.fields.CharField')(max_length=100)),
            ('trigger', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['Logger.Trigger'], null=True, blank=True)),
        ))
        db.send_create_signal('Logger', ['Event'])

        # Adding M2M table for field involved_objects on 'Event'
        db.create_table('Logger_event_involved_objects', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('event', models.ForeignKey(orm['Logger.event'], null=False)),
            ('logobject', models.ForeignKey(orm['Logger.logobject'], null=False))
        ))
        db.create_unique('Logger_event_involved_objects', ['event_id', 'logobject_id'])

        # Adding model 'Trigger'
        db.create_table('Logger_trigger', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('evaluator', self.gf('django.db.models.fields.TextField')()),
            ('namespace', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['Logger.Namespace'])),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=300)),
        ))
        db.send_create_signal('Logger', ['Trigger'])


    def backwards(self, orm):
        # Deleting model 'LogObject'
        db.delete_table('Logger_logobject')

        # Deleting model 'TriggerError'
        db.delete_table('Logger_triggererror')

        # Deleting model 'EventType'
        db.delete_table('Logger_eventtype')

        # Deleting model 'Namespace'
        db.delete_table('Logger_namespace')

        # Deleting model 'Event'
        db.delete_table('Logger_event')

        # Removing M2M table for field involved_objects on 'Event'
        db.delete_table('Logger_event_involved_objects')

        # Deleting model 'Trigger'
        db.delete_table('Logger_trigger')


    models = {
        'Logger.event': {
            'Meta': {'object_name': 'Event'},
            'date': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'info': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'involved_objects': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'events'", 'symmetrical': 'False', 'to': "orm['Logger.LogObject']"}),
            'tag': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'trigger': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['Logger.Trigger']", 'null': 'True', 'blank': 'True'}),
            'type': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['Logger.EventType']"})
        },
        'Logger.eventtype': {
            'Meta': {'object_name': 'EventType'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'namespace': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['Logger.Namespace']"})
        },
        'Logger.logobject': {
            'Meta': {'object_name': 'LogObject'},
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
            'evaluator': ('django.db.models.fields.TextField', [], {}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'trigger': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['Logger.Trigger']"})
        }
    }

    complete_apps = ['Logger']